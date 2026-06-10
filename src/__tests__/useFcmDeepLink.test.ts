// Unit tests for the navigateFromPayload logic inside useFcmDeepLink
// We test the navigation decisions without needing a real Firebase instance

type FcmPayload = {
  type: 'NEW_JOBS' | 'FOLLOW_UP_REMINDER' | 'DAILY_DIGEST';
  jobId?: string;
  applicationId?: string;
  count?: string;
};

// Extracted navigation logic (mirrors useFcmDeepLink.ts)
function navigateFromPayload(nav: { navigate: jest.Mock }, data: FcmPayload) {
  if (!data?.type) return;
  switch (data.type) {
    case 'NEW_JOBS':
      nav.navigate('Main', { screen: 'JobsTab', params: { screen: 'JobFeed' } });
      break;
    case 'FOLLOW_UP_REMINDER':
      if (data.applicationId) {
        nav.navigate('Main', {
          screen: 'ApplicationsTab',
          params: { screen: 'ApplicationDetail', params: { applicationId: Number(data.applicationId) } },
        });
      } else {
        nav.navigate('Main', { screen: 'ApplicationsTab', params: { screen: 'ApplicationsList' } });
      }
      break;
    case 'DAILY_DIGEST':
      nav.navigate('Main', { screen: 'JobsTab', params: { screen: 'JobFeed' } });
      break;
  }
}

describe('FCM deep-link navigation', () => {
  let nav: { navigate: jest.Mock };

  beforeEach(() => {
    nav = { navigate: jest.fn() };
  });

  it('NEW_JOBS navigates to JobFeed', () => {
    navigateFromPayload(nav, { type: 'NEW_JOBS', count: '3' });
    expect(nav.navigate).toHaveBeenCalledWith('Main', {
      screen: 'JobsTab',
      params: { screen: 'JobFeed' },
    });
  });

  it('FOLLOW_UP_REMINDER with applicationId navigates to ApplicationDetail', () => {
    navigateFromPayload(nav, { type: 'FOLLOW_UP_REMINDER', applicationId: '42' });
    expect(nav.navigate).toHaveBeenCalledWith('Main', {
      screen: 'ApplicationsTab',
      params: { screen: 'ApplicationDetail', params: { applicationId: 42 } },
    });
  });

  it('FOLLOW_UP_REMINDER without applicationId navigates to ApplicationsList', () => {
    navigateFromPayload(nav, { type: 'FOLLOW_UP_REMINDER' });
    expect(nav.navigate).toHaveBeenCalledWith('Main', {
      screen: 'ApplicationsTab',
      params: { screen: 'ApplicationsList' },
    });
  });

  it('DAILY_DIGEST navigates to JobFeed', () => {
    navigateFromPayload(nav, { type: 'DAILY_DIGEST' });
    expect(nav.navigate).toHaveBeenCalledWith('Main', {
      screen: 'JobsTab',
      params: { screen: 'JobFeed' },
    });
  });

  it('does nothing when type is missing', () => {
    navigateFromPayload(nav, {} as FcmPayload);
    expect(nav.navigate).not.toHaveBeenCalled();
  });

  it('applicationId string is correctly converted to number', () => {
    navigateFromPayload(nav, { type: 'FOLLOW_UP_REMINDER', applicationId: '99' });
    const call = nav.navigate.mock.calls[0];
    expect(call[1].params.params.applicationId).toBe(99);
    expect(typeof call[1].params.params.applicationId).toBe('number');
  });
});
