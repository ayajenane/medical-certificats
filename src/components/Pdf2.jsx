import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { useToast } from "../context/ToastContext";
import { getPilots } from "../utils/pilots";
import { createCertificate } from "../utils/certificates";
import "./Pdf2.css";

// état initial vide du formulaire, une clé par champ du certificat classe 2
const EMPTY_FORM = {
  state_authority: "",
  certificate_number: "",
  holder_name: "",
  birth_date: "",
  nationality: "",
  holder_signature: "",
  expiry_class1_single: "",
  expiry_class1_other: "",
  expiry_class2: "",
  expiry_lapl: "",
  lim_0_code: "", lim_0_desc: "",
  lim_1_code: "", lim_1_desc: "",
  lim_2_code: "", lim_2_desc: "",
  lim_3_code: "", lim_3_desc: "",
  lim_4_code: "", lim_4_desc: "",
  issue_date: "",
  ame_signature: "",
  stamp: "",
  last_medical_date: "",
  last_ecg_date: "",
  last_audiogram_date: "",
};

// pré-remplit le formulaire depuis les infos du pilote, la classe médicale détermine quel champ de date recevoir
function prefillFromPilot(prev, pilot) {
  const next = {
    ...prev,
    holder_name: pilot.name || prev.holder_name,
    nationality: pilot.nationality || prev.nationality,
    certificate_number: pilot.certificateNumber || prev.certificate_number,
  };
  if (pilot.expiryDate) {
    const d = pilot.expiryDate.slice(0, 10);
    const mc = pilot.medicalClass || "2";
    if (mc === "1") { next.expiry_class1_single = d; next.expiry_class1_other = d; }
    else if (mc === "2") { next.expiry_class2 = d; }
    else { next.expiry_lapl = d; }
  }
  return next;
}

// Formulaire du certificat médical Classe 2 (privé) — saisie + génération PDF + sauvegarde en base
function Pdf2() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [pilots, setPilots] = useState([]);
  const [selectedPilotId, setSelectedPilotId] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const wrapperRef = useRef(null); // cible de la capture html2canvas pour le PDF

  // le certificat a besoin de toute la largeur d'écran, on remet le style d'origine au démontage
  useEffect(() => {
    const root = document.getElementById("root");
    const prevWidth = root.style.width;
    const prevMaxWidth = root.style.maxWidth;
    const prevTextAlign = root.style.textAlign;
    root.style.width = "100%";
    root.style.maxWidth = "none";
    root.style.textAlign = "left";
    return () => {
      root.style.width = prevWidth;
      root.style.maxWidth = prevMaxWidth;
      root.style.textAlign = prevTextAlign;
    };
  }, []);

  // charge la liste des pilotes pour le sélecteur (aucune présélection automatique :
  // le formulaire reste vide tant qu'aucun pilote n'est explicitement choisi).
  useEffect(() => {
    getPilots({ archived: false, sort: "name", limit: 1000 })
      .then((res) => setPilots(res.data))
      .catch(() => {});
  }, []);

  // pré-remplit le formulaire depuis un pilote ou un certificat déjà existant passé via la navigation
  useEffect(() => {
    const cert = location.state?.certificate;
    if (cert) {
      if (cert.pilotId) setSelectedPilotId(cert.pilotId);
      if (cert.formData) setFormData((prev) => ({ ...prev, ...cert.formData }));
      return;
    }
    const pilot = location.state?.pilot;
    if (!pilot) return;
    setSelectedPilotId(pilot.id);
    setFormData((prev) => prefillFromPilot(prev, pilot));
  }, [location.state]);

  // met à jour un champ du formulaire au fil de la saisie
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // pré-remplit le formulaire uniquement quand l'utilisateur choisit explicitement un pilote
  const handlePilotSelect = (e) => {
    const pilotId = e.target.value;
    setSelectedPilotId(pilotId);
    if (!pilotId) return;
    const pilot = pilots.find((p) => p.id === pilotId);
    if (!pilot) return;
    setFormData((prev) => prefillFromPilot(prev, pilot));
  };

  const generatePDF = async () => {
    // import dynamique pour pas alourdir le bundle initial
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");

    const wrapper = wrapperRef.current;
    const canvas = await html2canvas(wrapper, {
      scale: 2,
      width: wrapper.scrollWidth,
      height: wrapper.scrollHeight,
      ignoreElements: (el) =>
        el.id === "generate-pdf-2" || el.classList?.contains("pdf2-toolbar"),
    });

    const pdf = new jsPDF("L", "mm", "a4");
    const imgData = canvas.toDataURL("image/png");

    const margin = 5;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const maxWidth = pageWidth - margin * 2;
    const maxHeight = pageHeight - margin * 2;

    const ratio = canvas.width / canvas.height;
    let imgWidth = maxWidth;
    let imgHeight = imgWidth / ratio;
    if (imgHeight > maxHeight) { imgHeight = maxHeight; imgWidth = imgHeight * ratio; } // évite que l'image déborde en hauteur

    pdf.addImage(imgData, "PNG", (pageWidth - imgWidth) / 2, (pageHeight - imgHeight) / 2, imgWidth, imgHeight);
    pdf.save("certificat-classe2.pdf");
  };

  // déclenche le téléchargement du PDF puis tente d'enregistrer le certificat dans le dossier du pilote
  const handleGenerate = async () => {
    await generatePDF(); // le pdf est généré même si l'enregistrement en base échoue après

    // sans pilote sélectionné on ne peut pas rattacher le certificat à un dossier
    if (!selectedPilotId) {
      const msg = "Sélectionnez un pilote dans la liste ci-dessus pour enregistrer ce certificat dans son dossier.";
      setSaveError(msg);
      toast.error(msg);
      return;
    }

    const pilot = pilots.find((p) => p.id === selectedPilotId) || location.state?.pilot;
    const mc = pilot?.medicalClass || "2";
    // la classe 2 est utilisée comme valeur par défaut pour la classe LAPL si son champ est vide
    const expiryDate =
      mc === "1"
        ? formData.expiry_class1_single || formData.expiry_class1_other
        : mc === "2"
        ? formData.expiry_class2
        : formData.expiry_lapl || formData.expiry_class2;

    if (!formData.certificate_number || !formData.issue_date || !expiryDate) {
      const msg = `Numéro de certificat, date de délivrance et date d'expiration (Classe ${mc}) sont requis pour enregistrer le certificat.`;
      setSaveError(msg);
      toast.error(msg);
      return;
    }

    setSaveError("");
    setSaving(true);
    try {
      await createCertificate({
        pilotId: selectedPilotId,
        certificateNumber: formData.certificate_number,
        issueDate: formData.issue_date,
        expiryDate,
        medicalClass: mc,
        formData,
      });
      toast.success("Certificat généré et enregistré dans le dossier du pilote.");
    } catch (err) {
      const msg = err.response?.data?.message || "Erreur lors de l'enregistrement du certificat.";
      setSaveError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div id="certificate-wrapper-2" ref={wrapperRef}>
      {/* Toolbar (exclu du PDF) */}
      <div className="pdf2-toolbar">
        <button type="button" className="pdf2-back-btn" onClick={() => navigate("/pilots")}>
          <ArrowLeft size={16} />
          Retour aux pilotes
        </button>

        <label htmlFor="pilot-select-2" style={{ marginLeft: 16, fontWeight: 600 }}>
          Pilote :
        </label>
        <select id="pilot-select-2" value={selectedPilotId} onChange={handlePilotSelect} style={{ marginLeft: 8 }}>
          <option value="">— Sélectionner un pilote —</option>
          {pilots.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* message d'erreur affiché si la sauvegarde du certificat échoue */}
      {saveError && (
        <div className="alert-banner" style={{ marginBottom: 14 }}>
          <div className="alert-content">
            <AlertTriangle size={18} className="alert-icon" />
            <p>{saveError}</p>
          </div>
        </div>
      )}

      {/* 4 colonnes qui reproduisent la mise en page du vrai certificat classe 2 */}
      <div className="pdf2-forms">

        {/* Colonne 1 — Identité du titulaire */}
        <form className="pdf2-form">
          <div className="pdf2-cert-title">Certificat Médical<br/>Medical Certificate</div>

          <label>
            I. État dans lequel la licence de pilote a été délivrée ou demandée /<br/>
            Authority that issued or is to issue the pilot licence
          </label>
          <input type="text" name="state_authority" value={formData.state_authority} onChange={handleChange} />

          <label>II. Numéro de certificat / Certificate number</label>
          <input type="text" name="certificate_number" value={formData.certificate_number} onChange={handleChange} required />

          <label>III. Nom et prénom du titulaire / Last and First Name of Holder</label>
          <input type="text" name="holder_name" value={formData.holder_name} onChange={handleChange} required />

          <label>IV. Date de naissance (JJ/MM/AAAA) / Date and Place of Birth (DD/MM/YYYY)</label>
          <input type="text" name="birth_date" value={formData.birth_date} onChange={handleChange} placeholder="JJ/MM/AAAA" />

          <label>V. Nationalité / Nationality</label>
          <input type="text" name="nationality" value={formData.nationality} onChange={handleChange} />

          <label>VI. Signature du titulaire / Signature of Holder</label>
          <div className="pdf2-signature-box" />
        </form>

        {/* Colonne 2 — Validité par classe */}
        <form className="pdf2-form">
          <div className="pdf2-cert-title">II Certificat médical de classe 1</div>
          <label>
            VII. Date d'expiration de ce certificat pour (JJ/MM/AAAA) /<br/>
            Expiry Date of this certificate (DD/MM/YYYY)
          </label>
          <table className="pdf2-validity-table">
            <tbody>
              <tr>
                <td>
                  Classe 1, exploitation commerciale monopilote avec transport de passagers /<br/>
                  Class 1, single pilot commercial operations carrying passengers
                </td>
                <td>
                  <input type="date" name="expiry_class1_single" value={formData.expiry_class1_single} onChange={handleChange} />
                </td>
              </tr>
              <tr>
                <td>
                  Classe 1, autres exploitations commerciales /<br/>
                  Class 1, other commercial operations
                </td>
                <td>
                  <input type="date" name="expiry_class1_other" value={formData.expiry_class1_other} onChange={handleChange} />
                </td>
              </tr>
              <tr>
                <td>Classe 2 / Class 2</td>
                <td>
                  <input type="date" name="expiry_class2" value={formData.expiry_class2} onChange={handleChange} />
                </td>
              </tr>
              <tr>
                <td>LAPL / LAPL</td>
                <td>
                  <input type="date" name="expiry_lapl" value={formData.expiry_lapl} onChange={handleChange} />
                </td>
              </tr>
            </tbody>
          </table>
        </form>

        {/* Colonne 3 — Limitations & Délivrance */}
        <form className="pdf2-form">
          <label>VIII. Limitations</label>
          <table className="pdf2-lim-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {[0, 1, 2, 3, 4].map((i) => (
                <tr key={i}>
                  <td>
                    <input type="text" name={`lim_${i}_code`} value={formData[`lim_${i}_code`]} onChange={handleChange} />
                  </td>
                  <td>
                    <input type="text" name={`lim_${i}_desc`} value={formData[`lim_${i}_desc`]} onChange={handleChange} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <label>IX. Date de délivrance / Date of Issue</label>
          <input type="date" name="issue_date" value={formData.issue_date} onChange={handleChange} required />

          <label>
            Signature de l'AME ou de l'évaluateur médical /<br/>
            Signature of Issuing AME or medical assessor
          </label>
          <div className="pdf2-signature-box" />

          <label>X. Cachet / Stamp</label>
          <div className="pdf2-stamp-box" />
        </form>

        {/* Colonne 4 — Dates des derniers examens */}
        <form className="pdf2-form">
          <label>Date du dernier examen médical /<br/>Date of last medical examination</label>
          <input type="date" name="last_medical_date" value={formData.last_medical_date} onChange={handleChange} />

          <label>Date du dernier électrocardiogramme /<br/>Date of last electrocardiogram</label>
          <input type="date" name="last_ecg_date" value={formData.last_ecg_date} onChange={handleChange} />

          <label>Date du dernier audiogramme /<br/>Date of last audiogram</label>
          <input type="date" name="last_audiogram_date" value={formData.last_audiogram_date} onChange={handleChange} />
        </form>

      </div>

      <button id="generate-pdf-2" type="button" onClick={handleGenerate} disabled={saving}>
        {saving ? "Enregistrement…" : "Générer le certificat"}
      </button>
    </div>
  );
}

export default Pdf2;
