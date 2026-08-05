// Fill the official Causeway proxy PDF template with form values (pdf-lib).
(function () {
  window.CCO = window.CCO || {};

  const TEMPLATE_URL = "assets/proxy-form-template.pdf";
  const PAGE_HEIGHT = 792;

  // Blank / label regions measured from the official template (PDF points, top-left origin).
  const FIELDS = {
    owner1: { x: 107, y: 185, w: 116, h: 9 },
    owner2: { x: 228, y: 185, w: 98, h: 9 },
    units: [
      { unit: { x: 117, y: 205, w: 24, h: 9 }, week: { x: 158, y: 205, w: 16, h: 9 }, scheduleIndex: 0 },
      { unit: { x: 331, y: 205, w: 24, h: 9 }, week: { x: 372, y: 205, w: 16, h: 9 }, scheduleIndex: 1 },
      { unit: { x: 117, y: 215, w: 24, h: 9 }, week: { x: 158, y: 215, w: 16, h: 9 }, scheduleIndex: 2 },
      { unit: { x: 331, y: 215, w: 24, h: 9 }, week: { x: 372, y: 215, w: 16, h: 9 }, scheduleIndex: 3 },
    ],
    // Annual / Even / Odd boxes per unit slot (same order as units above)
    schedules: [
      { Annual: [175.7, 204.9, 201.2, 213.6], Even: [205.5, 204.9, 223.0, 213.6], Odd: [234.9, 204.9, 251.1, 213.6] },
      { Annual: [390.0, 204.9, 415.3, 213.6], Even: [419.5, 204.9, 437.0, 213.6], Odd: [449.0, 204.9, 465.2, 213.6] },
      { Annual: [175.7, 214.8, 201.2, 223.6], Even: [205.5, 214.8, 223.0, 223.6], Odd: [234.9, 214.8, 251.1, 223.6] },
      { Annual: [390.0, 214.8, 415.3, 223.6], Even: [419.5, 214.8, 437.0, 223.6], Odd: [449.0, 214.8, 465.2, 223.6] },
    ],
    date: { x: 100, y: 444, w: 64, h: 9 },
    printedName: { x: 179, y: 474, w: 255, h: 9 },
    phone: { x: 129, y: 651, w: 134, h: 8 },
    email: { x: 319, y: 651, w: 183, h: 8 },
  };

  function topLeftToPdfY(yTop, height) {
    return PAGE_HEIGHT - yTop - height;
  }

  function fitText(font, text, size, maxWidth) {
    let value = String(text || "");
    if (!value) return { text: "", size: size };
    let current = size;
    while (current > 6 && font.widthOfTextAtSize(value, current) > maxWidth) {
      current -= 0.25;
    }
    while (font.widthOfTextAtSize(value, current) > maxWidth && value.length > 1) {
      value = value.slice(0, -1);
    }
    return { text: value, size: current };
  }

  function coverRect(page, box) {
    page.drawRectangle({
      x: box.x,
      y: topLeftToPdfY(box.y, box.h),
      width: box.w,
      height: box.h,
      color: PDFLib.rgb(1, 1, 1),
    });
  }

  function writeInBox(page, font, text, box, baseSize) {
    if (!text) return;
    coverRect(page, box);
    const fitted = fitText(font, text, baseSize, box.w - 2);
    page.drawText(fitted.text, {
      x: box.x + 1,
      y: topLeftToPdfY(box.y, box.h) + 1.5,
      size: fitted.size,
      font: font,
      color: PDFLib.rgb(0, 0, 0),
    });
  }

  function circleSchedule(page, rect) {
    const [x0, y0, x1, y1] = rect;
    const padX = 2;
    const padY = 1.5;
    page.drawEllipse({
      x: (x0 + x1) / 2,
      y: PAGE_HEIGHT - (y0 + y1) / 2,
      xScale: (x1 - x0) / 2 + padX,
      yScale: (y1 - y0) / 2 + padY,
      borderColor: PDFLib.rgb(0, 0, 0),
      borderWidth: 0.9,
    });
  }

  async function fillProxyPdf(data) {
    if (!window.PDFLib) {
      throw new Error("PDF library failed to load. Please refresh and try again.");
    }

    const response = await fetch(TEMPLATE_URL);
    if (!response.ok) {
      throw new Error("Could not load the proxy form template.");
    }

    const templateBytes = await response.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(templateBytes);
    const page = pdfDoc.getPages()[0];
    const font = await pdfDoc.embedFont(PDFLib.StandardFonts.TimesRoman);

    writeInBox(page, font, data.owner1, FIELDS.owner1, 9);
    writeInBox(page, font, data.owner2, FIELDS.owner2, 9);

    data.units.forEach(function (unit, index) {
      const slot = FIELDS.units[index];
      if (!slot) return;
      if (unit.unit && unit.unit !== "____") {
        writeInBox(page, font, unit.unit, slot.unit, 9);
      }
      if (unit.week && unit.week !== "____") {
        writeInBox(page, font, unit.week, slot.week, 9);
      }
      const scheduleMap = FIELDS.schedules[index];
      if (scheduleMap && unit.schedule && scheduleMap[unit.schedule]) {
        circleSchedule(page, scheduleMap[unit.schedule]);
      }
    });

    writeInBox(page, font, data.date, FIELDS.date, 9);
    writeInBox(page, font, data.printedName, FIELDS.printedName, 9);
    writeInBox(page, font, data.phone, FIELDS.phone, 8);
    writeInBox(page, font, data.email, FIELDS.email, 8);

    if (data.note) {
      const notePage = pdfDoc.addPage([612, 792]);
      const noteFont = await pdfDoc.embedFont(PDFLib.StandardFonts.TimesRoman);
      notePage.drawText("Note attached to proxy", {
        x: 72,
        y: 720,
        size: 14,
        font: noteFont,
      });
      notePage.drawText("Owner(s): " + (data.ownerLine || [data.owner1, data.owner2].filter(Boolean).join(" / ")), {
        x: 72,
        y: 698,
        size: 10,
        font: noteFont,
      });

      const maxWidth = 468;
      const words = String(data.note).split(/\s+/);
      let line = "";
      let y = 670;
      words.forEach(function (word) {
        const next = line ? line + " " + word : word;
        if (noteFont.widthOfTextAtSize(next, 10) > maxWidth) {
          notePage.drawText(line, { x: 72, y: y, size: 10, font: noteFont });
          y -= 14;
          line = word;
        } else {
          line = next;
        }
      });
      if (line) {
        notePage.drawText(line, { x: 72, y: y, size: 10, font: noteFont });
      }
    }

    return pdfDoc.save();
  }

  function downloadPdfBytes(bytes, filename) {
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || "Causeway-Proxy-Form.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  window.CCO.fillProxyPdf = fillProxyPdf;
  window.CCO.downloadProxyPdf = async function (data) {
    const bytes = await fillProxyPdf(data);
    downloadPdfBytes(bytes, "Causeway-Proxy-Form.pdf");
    return bytes;
  };
})();
