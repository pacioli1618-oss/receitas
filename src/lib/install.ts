// "Fixar na tela do celular": putting the app on the home screen (installing the PWA).
//
// Chrome, Edge and Samsung Internet on Android fire `beforeinstallprompt`: we keep that event
// and show our own button. Safari on iPhone has no such event, so we show the two taps
// (Share → Add to Home Screen). In-app browsers (WhatsApp, Instagram) cannot install at all:
// the person has to open the link in the real browser first.
//
// Browser only. The event can fire before any screen mounts, so InstallListener (in the root
// layout) captures it into this module and screens read it through useInstall().

export type InstallMode =
  /** Already running from the home screen. */
  | 'installed'
  /** The browser gave us an install prompt: one tap. */
  | 'prompt'
  /** iPhone or iPad: Share → Add to Home Screen. */
  | 'ios'
  /** Android browser with no prompt (Firefox, or Chrome before it decides): ⋮ menu → Install. */
  | 'menu'
  /** Inside WhatsApp, Instagram…: open in the browser first. */
  | 'in-app'
  /** Desktop without a prompt: nothing useful to say. */
  | 'unsupported';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{outcome: 'accepted' | 'dismissed'}>;
};

let deferredPrompt: InstallPromptEvent | null = null;
let isJustInstalled = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

export function subscribeToInstall(listener: () => void) {
  listeners.add(listener);
  const media = window.matchMedia('(display-mode: standalone)');
  media.addEventListener('change', listener);
  return () => {
    listeners.delete(listener);
    media.removeEventListener('change', listener);
  };
}

/** Called once from the root layout. */
export function listenForInstallPrompt() {
  const handlePrompt = (event: Event) => {
    event.preventDefault(); // we show our own button instead of the browser's mini-bar
    deferredPrompt = event as InstallPromptEvent;
    notify();
  };
  const handleInstalled = () => {
    deferredPrompt = null;
    isJustInstalled = true;
    notify();
  };
  window.addEventListener('beforeinstallprompt', handlePrompt);
  window.addEventListener('appinstalled', handleInstalled);
  return () => {
    window.removeEventListener('beforeinstallprompt', handlePrompt);
    window.removeEventListener('appinstalled', handleInstalled);
  };
}

export function isRunningInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & {standalone?: boolean}).standalone === true;
}

/** Pure, so it can be tested with sample user agents. */
export function detectInstallMode({userAgent, maxTouchPoints, isStandalone, hasPrompt}: {userAgent: string; maxTouchPoints: number; isStandalone: boolean; hasPrompt: boolean}): InstallMode {
  if (isStandalone) return 'installed';
  if (hasPrompt) return 'prompt';

  const isIos = /iPhone|iPad|iPod/i.test(userAgent) || (/Macintosh/i.test(userAgent) && maxTouchPoints > 1);
  const isAndroid = /Android/i.test(userAgent);
  const isKnownInApp = /FBAN|FBAV|FB_IAB|Instagram|WhatsApp|Line\/|MicroMessenger|TikTok/i.test(userAgent);
  // Android WebViews say "; wv)"; iOS in-app browsers (WKWebView) leave "Safari/" out.
  const isWebView = (isAndroid && /;\s?wv\)/i.test(userAgent)) || (isIos && !/Safari\//i.test(userAgent));

  if (isKnownInApp || isWebView) return isIos || isAndroid ? 'in-app' : 'unsupported';
  if (isIos) return 'ios';
  if (isAndroid) return 'menu';
  return 'unsupported';
}

export function getInstallMode(): InstallMode {
  if (isJustInstalled) return 'installed';
  return detectInstallMode({
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints ?? 0,
    isStandalone: isRunningInstalled(),
    hasPrompt: deferredPrompt !== null,
  });
}

/** Shows the browser's install dialog. Returns true when the person accepted. */
export async function promptInstall(): Promise<boolean> {
  const event = deferredPrompt;
  if (!event) return false;
  deferredPrompt = null; // a prompt can only be used once
  await event.prompt();
  const {outcome} = await event.userChoice;
  if (outcome === 'accepted') isJustInstalled = true;
  notify();
  return outcome === 'accepted';
}
