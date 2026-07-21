import { signInWithGoogleWeb } from '../utils/googleWebAuth';

function mockGoogleId(promptImpl: (cb: (n: any) => void) => void) {
  const initialize = jest.fn();
  const prompt = jest.fn(promptImpl);
  (window as any).google = { accounts: { id: { initialize, prompt } } };
  return { initialize, prompt };
}

describe('signInWithGoogleWeb', () => {
  afterEach(() => {
    delete (window as any).google;
    jest.useRealTimers();
  });

  it('resolves with the credential when Google calls back successfully', async () => {
    let capturedCallback: ((r: any) => void) | undefined;
    const { initialize } = mockGoogleId(() => {});
    (window.google.accounts.id.initialize as jest.Mock).mockImplementation((opts: any) => {
      capturedCallback = opts.callback;
    });

    const promise = signInWithGoogleWeb();
    // loadGisScript() resolves via a real microtask before initialize() is called —
    // flush the queue so the mock has actually captured the callback.
    await Promise.resolve();
    await Promise.resolve();
    capturedCallback!({ credential: 'id-token-abc' });

    await expect(promise).resolves.toBe('id-token-abc');
    expect(initialize).toHaveBeenCalledWith(expect.objectContaining({ use_fedcm_for_prompt: true }));
  });

  it('rejects with "Sign-in cancelled" only when the user actually dismisses a shown prompt', async () => {
    mockGoogleId((cb) => cb({ isDismissedMoment: () => true, isNotDisplayed: () => false, isSkippedMoment: () => false }));

    await expect(signInWithGoogleWeb()).rejects.toThrow('Sign-in cancelled');
  });

  it('rejects with an actionable message when Google never displays a prompt (BUG: silent hang)', async () => {
    mockGoogleId((cb) => cb({ isDismissedMoment: () => false, isNotDisplayed: () => true, isSkippedMoment: () => false }));

    await expect(signInWithGoogleWeb()).rejects.toThrow(/didn't show a sign-in prompt/);
  });

  it('rejects with an actionable message when the moment is skipped (e.g. FedCM decline)', async () => {
    mockGoogleId((cb) => cb({ isDismissedMoment: () => false, isNotDisplayed: () => false, isSkippedMoment: () => true }));

    await expect(signInWithGoogleWeb()).rejects.toThrow(/didn't show a sign-in prompt/);
  });

  it('times out instead of hanging forever when Google never calls back at all (BUG-MOB-022 repro)', async () => {
    jest.useFakeTimers();
    mockGoogleId(() => {
      // Simulates the observed real-world failure: FedCM aborts internally and
      // neither the init callback nor the prompt notification ever fires.
    });

    const promise = signInWithGoogleWeb();
    // Attach the rejection expectation before advancing timers, so the
    // rejection is "handled" from the moment it fires instead of briefly
    // dangling unhandled between the timer callback and the assertion.
    const expectation = expect(promise).rejects.toThrow(/didn't respond/);
    await jest.advanceTimersByTimeAsync(8000);

    await expectation;
  });
});
