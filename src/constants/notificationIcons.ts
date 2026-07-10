import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SocialNotifType } from '../store/slices/notificationSlice';

type IconSpec = { icon: ComponentProps<typeof Ionicons>['name']; color: string };

// Single source of truth for how each backend SocialNotification.Type renders —
// keep in sync with SocialNotification.Type in the backend entity.
export const NOTIFICATION_ICON: Record<SocialNotifType, IconSpec> = {
  FOLLOW:                    { icon: 'person-add-outline',       color: '#2563EB' },
  POST_LIKE:                 { icon: 'heart-outline',             color: '#EF4444' },
  POST_COMMENT:              { icon: 'chatbubble-outline',        color: '#10B981' },
  COMMENT_REPLY:             { icon: 'arrow-undo-outline',        color: '#10B981' },
  MENTION:                   { icon: 'at-outline',                color: '#8B5CF6' },
  DM:                        { icon: 'mail-outline',               color: '#F59E0B' },
  CONNECTION_REQUEST:        { icon: 'people-outline',            color: '#2563EB' },
  CONNECTION_ACCEPTED:       { icon: 'checkmark-circle-outline',  color: '#059669' },
  APPLICATION_STATUS_CHANGE: { icon: 'briefcase-outline',         color: '#2563EB' },
  INTERVIEW_SCHEDULED:       { icon: 'calendar-outline',          color: '#D97706' },
  OFFER_RECEIVED:            { icon: 'gift-outline',              color: '#059669' },
  QUICK_APPLY_SUBMITTED:     { icon: 'flash-outline',             color: '#7C3AED' },
  JOB_ALERT_MATCH:           { icon: 'notifications-outline',     color: '#2563EB' },
  FOLLOW_UP_REMINDER:        { icon: 'time-outline',               color: '#D97706' },
};

export const DEFAULT_NOTIFICATION_ICON: IconSpec = { icon: 'notifications-outline', color: '#6B7280' };
