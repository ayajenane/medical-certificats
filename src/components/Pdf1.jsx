import { useState, useRef, useEffect } from "react";
import "./Pdf1.css";

function Pdf1() {
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const generatePDF = async () => {
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");

    const wrapper = wrapperRef.current;
    const canvas = await html2canvas(wrapper, {
      scale: 2,
      width: wrapper.scrollWidth,
      height: wrapper.scrollHeight,
      ignoreElements: (el) => el.id === "generate-pdf",
    });

    const pdf = new jsPDF("L", "mm", "a4");
    const imgData = canvas.toDataURL("image/png");
    const imgWidth = 300;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    pdf.save("certificate.pdf");
  };

  return (
    <div id="certificate-wrapper" ref={wrapperRef}>
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

      <button id="generate-pdf" type="button" onClick={generatePDF}>
        Generate PDF
      </button>
    </div>
  );
}

export default Pdf1;
