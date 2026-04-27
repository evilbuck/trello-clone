// Google Analytics event tracking utility
// GA Measurement ID
const GA_MEASUREMENT_ID = 'G-0GMPP2YP2E';

// Declare global types for gtag
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

/**
 * Track a custom event in Google Analytics.
 * See: https://developers.google.com/analytics/devguides/collection/gtagjs/events
 */
export function trackEvent(action: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, params);
  }
}

/** Track user signup */
export function trackSignUp(method: string = 'email') {
  trackEvent('sign_up', { method });
}

/** Track user login */
export function trackLogin(method: string = 'email') {
  trackEvent('login', { method });
}

/** Track board creation */
export function trackCreateBoard(boardId: string, title: string) {
  trackEvent('create_board', { board_id: boardId, board_title: title });
}

/** Track list creation */
export function trackCreateList(listId: string, title: string, boardId: string) {
  trackEvent('create_list', { list_id: listId, list_title: title, board_id: boardId });
}

/** Track card creation */
export function trackCreateCard(cardId: string, title: string, listId: string, boardId: string) {
  trackEvent('create_card', { card_id: cardId, card_title: title, list_id: listId, board_id: boardId });
}
