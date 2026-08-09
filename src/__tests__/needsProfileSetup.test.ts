import { needsProfileSetup } from '../navigation/AppNavigator';

describe('needsProfileSetup', () => {
  it('returns false when user is null (not signed in yet)', () => {
    expect(needsProfileSetup(null)).toBe(false);
  });

  it('returns true when targetRole is missing', () => {
    expect(needsProfileSetup({ targetRole: null, targetLocation: 'Chennai' })).toBe(true);
  });

  it('returns true when targetLocation is missing', () => {
    expect(needsProfileSetup({ targetRole: 'Backend Engineer', targetLocation: null })).toBe(true);
  });

  it('returns true when both are missing', () => {
    expect(needsProfileSetup({ targetRole: null, targetLocation: null })).toBe(true);
  });

  it('returns false once both targetRole and targetLocation are set', () => {
    expect(needsProfileSetup({ targetRole: 'Backend Engineer', targetLocation: 'Chennai' })).toBe(false);
  });

  it('treats an empty string the same as missing', () => {
    expect(needsProfileSetup({ targetRole: '', targetLocation: 'Chennai' })).toBe(true);
  });
});
