/**
 * Demo-sessie voor Sophie-portaal (client-side; alleen voor demonstratie).
 */
(function (global) {
  "use strict";

  var SESSION_KEY = "sophie_demo_session";
  var DEMO_EMAIL = "sophie@demo.be";
  var DEMO_PASS = "Sophie123";

  function isLoggedIn() {
    try {
      return sessionStorage.getItem(SESSION_KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  /**
   * Zet demo-sessie vanuit URL (nodig bij file:// — elk .html-bestand heeft dan een eigen origin,
   * dus sessionStorage van login.html is niet zichtbaar op dashboard/index.html).
   */
  function consumeDemoAuthFromUrl() {
    try {
      var u = new URL(window.location.href);
      if (u.searchParams.get("sophie_demo_auth") !== "1") return false;
      sessionStorage.setItem(SESSION_KEY, "1");
      u.searchParams.delete("sophie_demo_auth");
      var q = u.searchParams.toString();
      var clean = u.pathname + (q ? "?" + q : "") + u.hash;
      history.replaceState({}, "", clean);
      return true;
    } catch (e) {
      return false;
    }
  }

  function tryLogin(email, password) {
    var pass = String(password || "").trim();
    return (
      String(email || "")
        .trim()
        .toLowerCase() === DEMO_EMAIL && pass === DEMO_PASS
    );
  }

  /** Na geslaagde login: bestemming + eenmalige auth zodat het doel-document de sessie kan zetten. */
  function loginRedirectUrl(rawNext) {
    var path = safeNext(rawNext);
    var sep = path.indexOf("?") >= 0 ? "&" : "?";
    return path + sep + "sophie_demo_auth=1";
  }

  function logout() {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch (e) {}
  }

  /** Voorkom open redirects: alleen relatief pad onder dashboard/. */
  function safeNext(raw) {
    var fallback = "dashboard/index.html";
    if (!raw) return fallback;
    var s;
    try {
      s = decodeURIComponent(String(raw)).trim();
    } catch (e) {
      return fallback;
    }
    if (s.indexOf("//") >= 0 || s.indexOf(":") >= 0 || s.indexOf("..") >= 0 || s.charAt(0) === "/") {
      return fallback;
    }
    if (s.indexOf("dashboard/") !== 0) return fallback;
    return s;
  }

  global.SophieAuth = {
    SESSION_KEY: SESSION_KEY,
    tryLogin: tryLogin,
    loginRedirectUrl: loginRedirectUrl,
    consumeDemoAuthFromUrl: consumeDemoAuthFromUrl,
    logout: logout,
    isLoggedIn: isLoggedIn,
    safeNext: safeNext,
  };
})(typeof window !== "undefined" ? window : this);
