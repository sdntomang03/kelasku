<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamSession;
use App\Models\ExamSessionUser;
use App\Models\ExamAttempt;
use App\Models\RegistrationSetting;
use App\Models\StudentAnswer;
use App\Services\AttemptScoringService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class StudentExamController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Ambil sesi ujian via relasi Many-to-Many
        $mySessions = $user->examSessions()
            ->withPivot('status', 'raw_score', 'final_score')
            ->with(['exam' => function ($query) {
                $query->withCount('questions');
            }])
            ->orderBy('start_time', 'asc')
            ->get()
            ->map(function ($session) {
                $session->is_open = now()->between($session->start_time, $session->end_time);
                $session->user_status = $session->pivot->status;
                $session->user_score = $session->pivot->final_score;

                return $session;
            });

        return view('student.exams.index', compact('mySessions'));
    }

    public function run(Exam $exam)
    {
        // Cek Token Ujian
        if ($exam->require_token && ! session()->has('verified_exam_'.$exam->id)) {
            return redirect()->route('student.exam.verify.show', $exam)
                ->with('error', 'Akses Ditolak! Silakan masukkan Token Ujian terlebih dahulu.');
        }

        $user = Auth::user();
        $now = Carbon::now('Asia/Jakarta');

        $session = ExamSession::where('exam_id', $exam->id)
            ->whereHas('students', fn ($q) => $q->where('users.id', $user->id))
            ->with('exam')
            ->firstOrFail();

        $pivot = $session->students()->where('users.id', $user->id)->first()->pivot;

        $examUser = ExamSessionUser::where('exam_session_id', $session->id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        if (request()->ajax()) {
            return response()->json([
                'status' => $pivot->status,
                'is_locked' => (bool) $examUser->is_locked,
            ]);
        }

        // BLOKIR 1: Jika terkunci
        if ($examUser->is_locked) {
            session()->forget('verified_exam_'.$exam->id);

            return redirect()->route('student.index')->with('error', 'AKSES DITOLAK: Ujian Anda telah dikunci karena pelanggaran.');
        }

        // BLOKIR 2: Jika sudah selesai
        if ($pivot->status === 'completed' || $pivot->finished_at !== null) {
            session()->forget('verified_exam_'.$exam->id);

            return redirect()->route('student.index')->with('info', 'Ujian ini telah ditutup atau sudah Anda selesaikan.');
        }

        // LOGIKA WAKTU MULAI
        if ($pivot->started_at === null) {
            $user->examSessions()->updateExistingPivot($session->id, [
                'started_at' => $now,
                'status' => 'ongoing',
                'finished_at' => null,
            ]);
            $startTime = $now;
        } else {
            $startTime = Carbon::parse($pivot->started_at)->timezone('Asia/Jakarta');
            if ($pivot->status === 'not_started') {
                $user->examSessions()->updateExistingPivot($session->id, ['status' => 'ongoing']);
            }
        }

        // PERHITUNGAN DEADLINE
        $duration = (int) $session->exam->duration_minutes;
        $deadlinePersonal = $startTime->copy()->addMinutes($duration);
        $deadlineSession = Carbon::parse($session->end_time)->timezone('Asia/Jakarta');
        $realDeadline = $deadlinePersonal->min($deadlineSession);
        $timeLeftSeconds = $now->diffInSeconds($realDeadline, false);

        if ($timeLeftSeconds <= 0 && $timeLeftSeconds > -60) {
            $timeLeftSeconds = 60;
        } elseif ($timeLeftSeconds <= -60) {
            // Asumsi Anda memiliki method forceFinish() di controller ini
            return $this->forceFinish($session);
        }

        // ==============================================================
        // PERUBAHAN AJAX: HANYA AMBIL ARRAY ID SOAL
        // ==============================================================
        if (! $exam->sections()->exists()) {
            $defaultSection = \App\Models\Section::firstOrCreate(
                ['abbreviation' => 'UTAMA'],
                ['name' => 'Sesi Utama']
            );
            $exam->sections()->create([
                'section_id' => $defaultSection->id,
                'scoring_profile_id' => $exam->scoring_profile_id,
                'order' => 1,
            ]);
        }

        $sections = $exam->sections()
            ->with(['section', 'questions' => fn ($query) => $query
                ->select(['questions.id', 'questions.exam_section_id'])
                ->orderBy('id')])
            ->orderBy('order')
            ->orderBy('id')
            ->get()
            ->map(fn ($section) => [
                'id' => $section->id,
                'name' => $section->section?->name ?? 'Sesi Utama',
                'question_ids' => $section->questions->pluck('id')->values()->all(),
            ])
            ->values()
            ->all();
        $questionIds = collect($sections)
            ->flatMap(fn ($section) => $section['question_ids'])
            ->values()
            ->all();

        $existingAnswers = StudentAnswer::where('exam_attempt_id', $examUser->id)
            ->pluck('answer', 'question_id')
            ->toArray();

        $flags = StudentAnswer::where('exam_attempt_id', $examUser->id)
            ->where('is_doubtful', true)
            ->pluck('question_id')
            ->toArray();

        $config = [
            'random_question' => $session->exam->random_question ?? false,
            'random_answer' => $session->exam->random_answer ?? false,
            'enable_violation' => $session->exam->enable_violation ?? true,
            'max_tolerances' => $session->exam->max_tolerances ?? 3,
        ];

        return view('student.exams.run', [
            'exam' => $session->exam,
            'questionIds' => $questionIds, // Ganti questions dengan questionIds
            'sections' => $sections,
            'config' => $config,
            'timeLeftSeconds' => (int) $timeLeftSeconds,
            'existingAnswers' => $existingAnswers,
            'flags' => $flags,
            'pivot' => $examUser,
        ]);
    }

    // ==============================================================
    // METHOD BARU: Melayani Request AJAX per Soal (AMAN & SENSOR)
    // ==============================================================
    // Gunakan parameter $hashed_exam_id sesuai route
    public function fetchSingleQuestion(Request $request, Exam $exam, $question_id)
    {
        $user = Auth::user();

        // Pastikan siswa terdaftar di sesi ujian ini
        $session = ExamSession::where('exam_id', $exam->id)
            ->whereHas('students', fn ($q) => $q->where('users.id', $user->id))
            ->firstOrFail();

        $examUser = ExamSessionUser::where('exam_session_id', $session->id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        // Tolak jika terkunci atau sudah selesai
        if ($examUser->is_locked) {
            return response()->json(['error' => 'Ujian terkunci'], 403);
        }

        $pivot = $session->students()->where('users.id', $user->id)->first()->pivot;
        if ($pivot->status === 'completed') {
            return response()->json(['error' => 'Ujian sudah selesai'], 403);
        }

        // Keamanan otomatis terjamin karena kita mencari dari dalam relasi ujian tersebut
        $question = $exam->questions()
            ->where('questions.id', $question_id) // Gunakan prefix questions. untuk keamanan query
            ->select(['questions.id', 'questions.type', 'questions.content', 'questions.explanation'])
            ->with([
                'options' => fn ($q) => $q->select(['id', 'question_id', 'option_text']),
                'matches' => fn ($q) => $q->select(['id', 'question_id', 'premise_text', 'target_text']),
            ])
            ->firstOrFail();

        return response()->json(['question' => $question]);
    }

    public function saveAnswer(Request $request)
    {
        $request->validate([
            'exam_id' => 'required',
            'question_id' => 'required',
        ]);

        $user = Auth::user();

        $examUser = ExamSessionUser::whereHas('session', function ($q) use ($request) {
            $q->where('exam_id', $request->exam_id);
        })->where('user_id', $user->id)->firstOrFail();

        if ($examUser->is_locked) {
            return response()->json([
                'status' => 'error',
                'message' => 'UJIAN TERKUNCI! Jawaban tidak disimpan.',
            ], 403);
        }

        $questionBelongsToExam = Exam::findOrFail($request->exam_id)->questions()
            ->where('questions.id', $request->question_id)
            ->exists();
        abort_unless($questionBelongsToExam, 404);

        StudentAnswer::updateOrCreate(
            [
                'exam_attempt_id' => $examUser->id,
                'question_id' => $request->question_id,
            ],
            [
                'answer' => $request->answer,
                'is_doubtful' => $request->is_doubtful ?? false,
            ]
        );

        return response()->json(['status' => 'success']);
    }

    public function finish($exam_id)
    {
        $user = Auth::user();
        $session = ExamSession::where('exam_id', $exam_id)
            ->whereHas('students', fn ($q) => $q->where('users.id', $user->id))
            ->firstOrFail();

        return $this->forceFinish($session);
    }

    private function forceFinish($session)
    {
        $user = Auth::user();
        $attempt = ExamAttempt::where('exam_session_id', $session->id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        if ($attempt->status === 'completed') {
            return redirect()->route('student.exam.result', $session->exam);
        }

        $result = app(AttemptScoringService::class)->scoreAttempt($attempt);
        session()->forget('verified_exam_'.$session->exam_id);

        return redirect()->route('student.exam.result', $session->exam);
    }

    public function result(Exam $exam)
    {
        $attempt = ExamAttempt::whereHas('session', fn ($query) => $query->where('exam_id', $exam->id))
            ->where('user_id', Auth::id())
            ->where('status', 'completed')
            ->latest('finished_at')
            ->firstOrFail();

        $scoring = app(AttemptScoringService::class);
        $sectionResults = $scoring->sectionResults($attempt);
        $averageScore = round($sectionResults->avg('score') ?? 0, 2);
        $resultMode = $exam->scoringProfile
            ? $scoring->resultMode($exam->scoringProfile)
            : ($sectionResults->first()['result_mode'] ?? 'average');

        return view('student.exams.result', compact('exam', 'attempt', 'sectionResults', 'averageScore', 'resultMode'));
    }

    public function recordViolation(Request $request)
    {
        $request->validate(['exam_id' => 'required']);
        $user = Auth::user();

        // 1. Cari Exam Session dengan relasi exam
        $session = ExamSession::where('exam_id', $request->exam_id)
            ->whereHas('students', fn ($q) => $q->where('users.id', $user->id))
            ->with('exam')
            ->firstOrFail();

        $examUser = ExamSessionUser::where('exam_session_id', $session->id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        // -----------------------------------------------------------------
        // [DINAMIS] CEK PELANGGARAN: Tolak catatan jika fitur OFF
        // -----------------------------------------------------------------
        $enableViolation = $session->exam->enable_violation ?? true;

        if (! $enableViolation) {
            return response()->json([
                'violation_count' => $examUser->violation_count,
                'is_locked' => false,
                'message' => 'Sensor pelanggaran dinonaktifkan oleh guru.',
            ]);
        }

        // 3. Tambah hitungan jika fitur ON
        $newCount = $examUser->violation_count + 1;
        $maxTolerances = $session->exam->max_tolerances ?? 3;
        $isLocked = $examUser->is_locked;

        if ($newCount >= $maxTolerances) {
            $isLocked = true;
        }

        $examUser->update([
            'violation_count' => $newCount,
            'is_locked' => $isLocked,
        ]);

        return response()->json([
            'violation_count' => $newCount,
            'max_tolerances' => $maxTolerances,
            'is_locked' => (bool) $isLocked,
        ]);
    }

    public function showVerifyPage(Exam $exam)
    {
        $user = Auth::user();

        $session = ExamSession::where('exam_id', $exam->id)
            ->whereHas('students', fn ($q) => $q->where('users.id', $user->id))
            ->with('exam')
            ->firstOrFail();

        $pivot = $session->students()->where('users.id', $user->id)->first()->pivot;

        if ($pivot->is_locked) {
            return redirect()->route('student.index')->with('error', 'AKSES DITOLAK: Ujian Anda telah dikunci karena pelanggaran.');
        }

        if ($pivot->status === 'completed' || $pivot->finished_at !== null) {
            return redirect()->route('student.index')->with('info', 'Anda sudah menyelesaikan ujian ini.');
        }

        $now = now();
        if (! $now->between($session->start_time, $session->end_time)) {
            return redirect()->route('student.index')->with('error', 'Sesi ujian belum dibuka atau sudah ditutup.');
        }

        // -----------------------------------------------------------------
        // [DINAMIS] BYPASS TOKEN: Jika tidak butuh token, langsung masuk
        // -----------------------------------------------------------------
        if (! $session->exam->require_token) {
            session()->put('verified_exam_'.$exam->id, true);

            return redirect()->route('student.exam.run', $exam);
        }

        if (session()->has('verified_exam_'.$exam->id) && $pivot->status === 'ongoing') {
            return redirect()->route('student.exam.run', $exam);
        }

        $isAutoToken = RegistrationSetting::where('school_id', $user->school_id)->exists();
        $defaultToken = $isAutoToken ? $session->token : null;

        return view('student.exams.verify', compact('session', 'defaultToken'));
    }

    public function processToken(Request $request, Exam $exam)
    {
        $request->validate([
            'token' => 'required|string',
        ]);

        $user = Auth::user();

        $session = ExamSession::where('exam_id', $exam->id)
            ->whereHas('students', fn ($q) => $q->where('users.id', $user->id))
            ->firstOrFail();

        if (strtoupper(trim($request->token)) !== strtoupper(trim($session->token))) {
            return back()->with('error', 'Token ujian tidak valid atau salah!');
        }

        session()->put('verified_exam_'.$exam->id, true);

        return redirect()->route('student.exam.run', $exam);
    }

    public function dashboard()
    {
        $user = auth()->user();

        $sessions = $user->examSessions()
            ->withPivot('status', 'final_score', 'started_at', 'finished_at', 'is_locked')
            ->with('exam:id,title,duration_minutes')
            ->orderBy('start_time')
            ->get();

        $now = now();
        $stats = [
            'total_ujian' => $sessions->count(),
            'ujian_selesai' => $sessions->where('pivot.status', 'completed')->count(),
            'ujian_aktif' => $sessions->filter(fn ($session) => $now->between($session->start_time, $session->end_time)
                && $session->pivot->status !== 'completed'
                && ! $session->pivot->is_locked)->count(),
            'rata_nilai' => $sessions->where('pivot.status', 'completed')->avg(fn ($session) => $session->pivot->final_score),
        ];

        $upcomingSessions = $sessions->filter(fn ($session) => $session->end_time->isFuture()
            && $session->pivot->status !== 'completed'
            && ! $session->pivot->is_locked)->take(4);
        $recentResults = $sessions->filter(fn ($session) => $session->pivot->status === 'completed')
            ->sortByDesc(fn ($session) => $session->pivot->finished_at ?? $session->end_time)->take(4);
        $classrooms = $user->classrooms()->pluck('name');

        return view('student.dashboard', compact(
            'user',
            'stats',
            'upcomingSessions',
            'recentResults',
            'classrooms'
        ));
    }

    public function checkStatus(Exam $exam)
    {
        $user = Auth::user();
        $examUser = ExamSessionUser::whereHas('session', fn ($q) => $q->where('exam_id', $exam->id))
            ->where('user_id', $user->id)
            ->select('status', 'is_locked')
            ->firstOrFail();

        return response()->json([
            'status' => $examUser->status,
            'is_locked' => (bool) $examUser->is_locked,
        ]);
    }
}
