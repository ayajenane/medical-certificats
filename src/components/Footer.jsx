// pied de page affiché sur toutes les pages, juste le nom de l'app et une courte description
function Footer() {
  return (
    <footer className="app-footer">
      <span className="app-footer-brand">MedCert Aviation</span>
      {/* simple séparateur visuel entre le nom et la description */}
      <span className="app-footer-sep">·</span>
      <span className="app-footer-note">Système de gestion des certifications médicales aéronautiques</span>
    </footer>
  );
}

export default Footer;
