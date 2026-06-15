import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { useToast } from "../context/ToastContext";
import { getPilots } from "../utils/pilots";
import { createCertificate } from "../utils/certificates";
import "./Pdf1.css";

function Pdf1() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const [formData, setFormData] = useState({
    certificate_number: "",
    holder_name: "",
    birth_details: "",
    address: "",
    nationality: "",
    signature: "",
    issue_date: "",
    restrictions: "",
    doctor_signature: "",
    class1_expiry: "",
    class2_expiry: "",
    class3_expiry: "",
    class4_expiry: "",
    exam_date: "",
    next_ecg: "",
    next_audiogram: "",
    next_ent: "",
    next_ophthalmology: "",
  });

  const [pilots, setPilots] = useState([]);
  const [selectedPilotId, setSelectedPilotId] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const wrapperRef = useRef(null);

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

  // Charge la liste des pilotes pour le sélecteur et présélectionne le premier
  // pilote afin que le certificat soit enregistré par défaut à la génération.
  useEffect(() => {
    getPilots({ archived: false, sort: "name", limit: 1000 })
      .then((res) => {
        setPilots(res.data);
        if (!location.state?.pilot && res.data.length > 0 && !selectedPilotId) {
          const first = res.data[0];
          setSelectedPilotId(first.id);
          setFormData((prev) => {
            const next = {
              ...prev,
              holder_name: first.name || prev.holder_name,
              nationality: first.nationality || prev.nationality,
            };
            const classKey = `class${first.medicalClass}_expiry`;
            if (classKey in next && first.expiryDate) {
              next[classKey] = first.expiryDate.slice(0, 10);
            }
            return next;
          });
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pré-remplit le formulaire si un pilote est passé depuis la page Pilotes
  useEffect(() => {
    const pilot = location.state?.pilot;
    if (!pilot) return;
    setSelectedPilotId(pilot.id);
    setFormData((prev) => {
      const next = {
        ...prev,
        holder_name: pilot.name || prev.holder_name,
        nationality: pilot.nationality || prev.nationality,
      };
      const classKey = `class${pilot.medicalClass}_expiry`;
      if (classKey in next && pilot.expiryDate) {
        next[classKey] = pilot.expiryDate.slice(0, 10);
      }
      return next;
    });
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectPilot = (e) => {
    const id = e.target.value;
    setSelectedPilotId(id);
    setSaveError("");
    const pilot = pilots.find((p) => p.id === id);
    if (!pilot) return;
    setFormData((prev) => {
      const next = {
        ...prev,
        holder_name: pilot.name || prev.holder_name,
        nationality: pilot.nationality || prev.nationality,
      };
      const classKey = `class${pilot.medicalClass}_expiry`;
      if (classKey in next && pilot.expiryDate) {
        next[classKey] = pilot.expiryDate.slice(0, 10);
      }
      return next;
    });
  };

  const generatePDF = async () => {
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");

    const wrapper = wrapperRef.current;
    const canvas = await html2canvas(wrapper, {
      scale: 2,
      width: wrapper.scrollWidth,
      height: wrapper.scrollHeight,
      ignoreElements: (el) => el.id === "generate-pdf" || el.classList?.contains("pdf1-toolbar"),
    });

    const pdf = new jsPDF("L", "mm", "a4");
    const imgData = canvas.toDataURL("image/png");

    // Ajuste l'image à la page A4 (297 x 210mm) en conservant le ratio,
    // avec une petite marge, pour éviter le décalage constaté à l'impression
    // (l'ancienne largeur fixe de 300mm dépassait la largeur de la page).
    const margin = 5;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const maxWidth = pageWidth - margin * 2;
    const maxHeight = pageHeight - margin * 2;

    const canvasRatio = canvas.width / canvas.height;
    let imgWidth = maxWidth;
    let imgHeight = imgWidth / canvasRatio;
    if (imgHeight > maxHeight) {
      imgHeight = maxHeight;
      imgWidth = imgHeight * canvasRatio;
    }

    const x = (pageWidth - imgWidth) / 2;
    const y = (pageHeight - imgHeight) / 2;

    pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
    pdf.save("certificate.pdf");
  };

  const handleGenerate = async () => {
    await generatePDF();

    if (!selectedPilotId) {
      const msg = "Sélectionnez un pilote dans la liste ci-dessus pour enregistrer ce certificat dans son dossier.";
      setSaveError(msg);
      toast.error(msg);
      return;
    }

    const pilot = pilots.find((p) => p.id === selectedPilotId) || location.state?.pilot;
    const medicalClass = pilot?.medicalClass || "1";
    const expiryDate = formData[`class${medicalClass}_expiry`];

    if (!formData.certificate_number || !formData.issue_date || !expiryDate) {
      const msg =
        "Numéro de certificat, date d'émission et date d'expiration (Classe " +
        medicalClass +
        ") sont requis pour enregistrer le certificat dans le dossier du pilote.";
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
        medicalClass,
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
    <div id="certificate-wrapper" ref={wrapperRef}>
      <div className="pdf1-toolbar">
        <button type="button" className="pdf1-back-btn" onClick={() => navigate("/pilots")}>
          <ArrowLeft size={16} />
          Retour aux pilotes
        </button>

        <div className="pdf1-pilot-select">
          <label htmlFor="pilot-select">Pilote associé * :</label>
          <select
            id="pilot-select"
            value={selectedPilotId}
            onChange={handleSelectPilot}
            style={!selectedPilotId ? { borderColor: "var(--red)" } : undefined}
          >
            <option value="">— Sélectionner un pilote —</option>
            {pilots.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.licenseNumber ? `(${p.licenseNumber})` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {saveError && (
        <div className="alert-banner" style={{ marginBottom: 14 }}>
          <div className="alert-content">
            <AlertTriangle size={18} className="alert-icon" />
            <p>{saveError}</p>
          </div>
        </div>
      )}

      <div className="forms">
        <form id="certificateForm">
          <label htmlFor="certificate_number">I. Certificate Number:</label>
          <input
            type="text"
            id="certificate_number"
            name="certificate_number"
            value={formData.certificate_number}
            onChange={handleChange}
            required
          />
          <label htmlFor="holder_name">II. Last and First Name of Holder:</label>
          <input
            type="text"
            id="holder_name"
            name="holder_name"
            value={formData.holder_name}
            onChange={handleChange}
            required
          />
          <label htmlFor="birth_details">III. Date and Place of Birth:</label>
          <input
            type="text"
            id="birth_details"
            name="birth_details"
            value={formData.birth_details}
            onChange={handleChange}
            required
          />
          <label htmlFor="address">IV. Address:</label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
          />
          <label htmlFor="nationality">V. Nationality:</label>
          <input
            type="text"
            id="nationality"
            name="nationality"
            value={formData.nationality}
            onChange={handleChange}
            required
          />
          <label htmlFor="signature">VI. Signature of Holder:</label>
          <input
            type="text"
            id="signature"
            name="signature"
            value={formData.signature}
            onChange={handleChange}
            required
          />
          <label htmlFor="issue_date">VII. Date of Issue:</label>
          <input
            type="date"
            id="issue_date"
            name="issue_date"
            value={formData.issue_date}
            onChange={handleChange}
            required
          />
        </form>

        <form id="certificateForm1">
          <label htmlFor="restrictions">
            VIII. Restrictions, Limitations, or Exemptions:
          </label>
          <textarea
            id="restrictions"
            name="restrictions"
            style={{ height: "396px", width: "384px" }}
            value={formData.restrictions}
            onChange={handleChange}
          />
          <label htmlFor="doctor_signature">
            IX. Signature and Stamp of Issuing AME or AMC:
          </label>
          <input
            type="text"
            className="doctor_signature"
            id="doctor_signature"
            name="doctor_signature"
            value={formData.doctor_signature}
            onChange={handleChange}
            required
          />
        </form>

        <form id="certificateForm2">
          <label>X. Validity</label>
          <table>
            <thead>
              <tr>
                <th>Class</th>
                <th>Expiry Date</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Class 1</td>
                <td>
                  <input
                    type="date"
                    name="class1_expiry"
                    value={formData.class1_expiry}
                    onChange={handleChange}
                  />
                </td>
              </tr>
              <tr>
                <td>Class 2</td>
                <td>
                  <input
                    type="date"
                    name="class2_expiry"
                    value={formData.class2_expiry}
                    onChange={handleChange}
                  />
                </td>
              </tr>
              <tr>
                <td>Class 3</td>
                <td>
                  <input
                    type="date"
                    name="class3_expiry"
                    value={formData.class3_expiry}
                    onChange={handleChange}
                  />
                </td>
              </tr>
              <tr>
                <td>Class 4</td>
                <td>
                  <input
                    type="date"
                    name="class4_expiry"
                    value={formData.class4_expiry}
                    onChange={handleChange}
                  />
                </td>
              </tr>
              <tr>
                <td>Examination Date:</td>
                <td>
                  <input
                    type="date"
                    name="exam_date"
                    value={formData.exam_date}
                    onChange={handleChange}
                  />
                </td>
              </tr>
              <tr>
                <td>Next ECG Date:</td>
                <td>
                  <input
                    type="date"
                    name="next_ecg"
                    value={formData.next_ecg}
                    onChange={handleChange}
                  />
                </td>
              </tr>
              <tr>
                <td>Next Audiogram Date:</td>
                <td>
                  <input
                    type="date"
                    name="next_audiogram"
                    value={formData.next_audiogram}
                    onChange={handleChange}
                  />
                </td>
              </tr>
              <tr>
                <td>Next ENT Examination Date:</td>
                <td>
                  <input
                    type="date"
                    name="next_ent"
                    value={formData.next_ent}
                    onChange={handleChange}
                  />
                </td>
              </tr>
              <tr>
                <td>Next Ophthalmology Exam Date:</td>
                <td>
                  <input
                    type="date"
                    name="next_ophthalmology"
                    value={formData.next_ophthalmology}
                    onChange={handleChange}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </form>
      </div>

      <button id="generate-pdf" type="button" onClick={handleGenerate} disabled={saving}>
        {saving ? "Enregistrement…" : "Générer le certificat"}
      </button>
    </div>
  );
}

export default Pdf1;
