export function getErrorMessage(error) {
  return error instanceof Error ? error.message : 'Terjadi kendala saat menghubungkan ke server.'
}
