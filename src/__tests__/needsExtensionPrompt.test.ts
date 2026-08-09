import { needsExtensionPrompt } from '../navigation/AppNavigator';

describe('needsExtensionPrompt', () => {
  it('returns true when the extension is not installed and not dismissed', () => {
    expect(needsExtensionPrompt(false, false)).toBe(true);
  });

  it('returns false once the extension is detected as installed', () => {
    expect(needsExtensionPrompt(true, false)).toBe(false);
  });

  it('returns false once the user has dismissed it, even if still not installed', () => {
    expect(needsExtensionPrompt(false, true)).toBe(false);
  });

  it('returns false when both installed and dismissed', () => {
    expect(needsExtensionPrompt(true, true)).toBe(false);
  });
});
