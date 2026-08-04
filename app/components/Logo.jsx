/**
 * Brand lockup from the Onward brand kit. Two files ship because the wordmark
 * is black in one and white in the other; CSS picks by colour scheme.
 */
export default function Logo({ className = "" }) {
  return (
    <span className={`logo ${className}`.trim()}>
      <img
        className="logo-img logo-on-light"
        src="/onward-logo-dark.png"
        alt="Onward Workspaces"
      />
      <img
        className="logo-img logo-on-dark"
        src="/onward-logo-light.png"
        alt=""
        aria-hidden="true"
      />
    </span>
  );
}
