// React Native's multipart encoder percent-encodes filenames containing spaces
// (e.g. "Muthu raja CV.pdf" -> "Muthu%20raja%20CV.pdf"). The backend now decodes
// this at upload time for new resumes (BUG-051), but existing rows uploaded before
// that fix still have the raw encoded name stored — decode defensively at display
// time too so already-broken data renders correctly without a DB migration.
export function decodeFileName(name: string): string {
  try {
    return decodeURIComponent(name);
  } catch {
    return name;
  }
}
