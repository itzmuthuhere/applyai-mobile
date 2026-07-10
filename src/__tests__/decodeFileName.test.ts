import { decodeFileName } from '../utils/decodeFileName';

describe('decodeFileName', () => {
  it('decodes percent-encoded spaces', () => {
    expect(decodeFileName('Muthu%20raja%20CV.pdf')).toBe('Muthu raja CV.pdf');
  });

  it('leaves an already-clean name unchanged', () => {
    expect(decodeFileName('Software Engineer Resume.pdf')).toBe('Software Engineer Resume.pdf');
  });

  it('falls back to the raw string on an invalid percent sequence', () => {
    // A literal '%' not followed by two hex digits is not valid percent-encoding
    expect(decodeFileName('Resume 100% Complete.pdf')).toBe('Resume 100% Complete.pdf');
  });
});
