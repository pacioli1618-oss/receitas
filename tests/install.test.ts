import assert from 'node:assert/strict';
import {test} from 'node:test';
import {detectInstallMode} from '../src/lib/install';

const iphoneSafari = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';
const iphoneChrome = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0 Mobile/15E148 Safari/604.1';
const iphoneInApp = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';
const ipadDesktopMode = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15';
const androidChrome = 'Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36';
const androidWebView = 'Mozilla/5.0 (Linux; Android 14; SM-A546E; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/131.0 Mobile Safari/537.36';
const instagram = `${androidChrome} Instagram 350.0`;
const desktopChrome = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';

const mode = (userAgent: string, extra: Partial<{maxTouchPoints: number; isStandalone: boolean; hasPrompt: boolean}> = {}) =>
  detectInstallMode({userAgent, maxTouchPoints: 0, isStandalone: false, hasPrompt: false, ...extra});

test('already on the home screen wins over everything', () => {
  assert.equal(mode(androidChrome, {isStandalone: true, hasPrompt: true}), 'installed');
});

test('a browser prompt means one tap', () => {
  assert.equal(mode(androidChrome, {hasPrompt: true}), 'prompt');
  assert.equal(mode(desktopChrome, {hasPrompt: true}), 'prompt');
});

test('iPhone and iPad get the Share steps, also in Chrome for iOS', () => {
  assert.equal(mode(iphoneSafari), 'ios');
  assert.equal(mode(iphoneChrome), 'ios');
  assert.equal(mode(ipadDesktopMode, {maxTouchPoints: 5}), 'ios');
});

test('in-app browsers must open the link in the real browser first', () => {
  assert.equal(mode(iphoneInApp), 'in-app');
  assert.equal(mode(androidWebView), 'in-app');
  assert.equal(mode(instagram), 'in-app');
});

test('Android without a prompt gets the menu steps; desktop without a prompt gets nothing', () => {
  assert.equal(mode(androidChrome), 'menu');
  assert.equal(mode(desktopChrome), 'unsupported');
  assert.equal(mode(ipadDesktopMode), 'unsupported');
});
