function PdfCard({ title, description, date, status, downloadUrl }) {
  return (
    <article className="pdf-card">
      <div className="pdf-card-title">
        <div>
          <h4>{title}</h4>
          <p>{description}</p>
        </div>
        <span className={status === "Validé" ? "pdf-badge pdf-badge-success" : "pdf-badge"}>
          {status}
        </span>
      </div>

      <div className="pdf-card-meta">
        <span>{date}</span>
        <a className="pdf-button" href={downloadUrl} target="_blank" rel="noreferrer">
          Télécharger
        </a>
      </div>
    </article>
  );
}

export default PdfCard;
