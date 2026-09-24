@props(['q'])

<div class="match-container">
    <div class="match-column">
        <template x-for="m in q.matches" :key="'p-'+m.id">
            <div class="match-item premise" :id="'premise-' + m.id" @click="clickMatch(q.id, m.id, 'premise')"
                :class="matchState.activePremise === m.id ? 'selected' : ''">

                <span x-html="m.premise_text"></span>
                <div class="match-dot dot-right"></div>
            </div>
        </template>
    </div>

    <div class="match-column">
        <template x-for="target in shuffledTargets[q.id]" :key="'t-'+target.id">
            <div class="match-item target" :id="'target-' + target.id" @click="clickMatch(q.id, target.id, 'target')"
                :class="matchState.activeTarget === target.id ? 'selected' : ''">

                <span x-text="target.text"></span>
                <div class="match-dot dot-left"></div>
            </div>
        </template>
    </div>
</div>
