import { Platform, Alert } from 'react-native';
import { MAIA2_SCALE, PastMaia2Assessment } from '@/constants/clinical-scales';

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface Maia2PdfInput {
  subscaleScores: Record<string, number>;
  assessmentDate: string;
  userName?: string;
  pastAssessments?: PastMaia2Assessment[];
}

function scoreColor(score: number): string {
  if (score >= 3.5) return '#7FB069';
  if (score >= 2) return '#6B5B95';
  return '#F0C05A';
}

function radarSvg(scores: Record<string, number>): string {
  const subscales = MAIA2_SCALE.subscales;
  const n = subscales.length;
  const cx = 160;
  const cy = 160;
  const R = 130;
  const levels = [1, 2, 3, 4, 5];

  function point(i: number, r: number): [number, number] {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  }

  const gridLines = levels
    .map(l => {
      const pts = subscales.map((_, i) => point(i, (l / 5) * R).join(',')).join(' ');
      return `<polygon points="${pts}" fill="none" stroke="#E4E9F2" stroke-width="1"/>`;
    })
    .join('');

  const spokes = subscales
    .map((_, i) => {
      const [x, y] = point(i, R);
      return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#E4E9F2" stroke-width="1"/>`;
    })
    .join('');

  const dataPts = subscales
    .map((s, i) => point(i, ((scores[s.key] ?? 0) / 5) * R).join(','))
    .join(' ');
  const dataArea = `<polygon points="${dataPts}" fill="#6B5B9530" stroke="#6B5B95" stroke-width="2"/>`;

  const labels = subscales
    .map((s, i) => {
      const [x, y] = point(i, R + 22);
      const shortNames: Record<string, string> = {
        noticing: 'Noticing',
        notDistracting: 'Not-Distr',
        notWorrying: 'Not-Worry',
        attentionRegulation: 'Attention',
        emotionalAwareness: 'Emotional',
        selfRegulation: 'Self-Reg',
        bodyListening: 'Body-List',
        trusting: 'Trusting',
      };
      const label = shortNames[s.key] ?? s.key;
      return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-size="11" fill="#6B7394">${label}</text>`;
    })
    .join('');

  return `<svg width="320" height="320" viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg">
    ${gridLines}${spokes}${dataArea}${labels}
  </svg>`;
}

function subscaleBars(
  scores: Record<string, number>,
  prevScores?: Record<string, number>,
): string {
  return MAIA2_SCALE.subscales
    .map(s => {
      const score = scores[s.key] ?? 0;
      const pct = Math.round((score / 5) * 100);
      const color = scoreColor(score);
      const prev = prevScores ? (prevScores[s.key] ?? null) : null;
      const diff = prev !== null ? score - prev : null;
      const diffStr =
        diff === null
          ? ''
          : diff > 0.1
          ? `<span style="color:#7FB069;font-size:11px;margin-left:6px;">+${diff.toFixed(1)}</span>`
          : diff < -0.1
          ? `<span style="color:#E85D5D;font-size:11px;margin-left:6px;">${diff.toFixed(1)}</span>`
          : `<span style="color:#9BA3C2;font-size:11px;margin-left:6px;">—</span>`;

      return `
      <div style="margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <span style="font-family:Arial,sans-serif;font-size:12px;color:#2D3142;font-weight:600;">${s.name}${diffStr}</span>
          <span style="font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:${color};">${score.toFixed(1)}/5</span>
        </div>
        <div style="height:8px;background:#EFF2F7;border-radius:4px;overflow:hidden;">
          <div style="height:100%;width:${pct}%;background:${color};border-radius:4px;"></div>
        </div>
        <div style="font-family:Arial,sans-serif;font-size:10px;color:#9BA3C2;margin-top:2px;">${s.description}</div>
      </div>`;
    })
    .join('');
}

function longitudinalTable(pastAssessments: PastMaia2Assessment[], currentScores: Record<string, number>): string {
  const cols = pastAssessments.slice(0, 3);
  const headerCols = cols
    .map(p => `<th style="text-align:right;padding:4px 8px;font-size:10px;color:#6B7394;font-weight:600;">${esc(p.date)}</th>`)
    .join('');

  const rows = MAIA2_SCALE.subscales
    .map(s => {
      const curr = currentScores[s.key] ?? 0;
      const pastCells = cols
        .map(p => {
          const v = p.subscaleScores[s.key] ?? 0;
          const d = curr - v;
          const arrow = d > 0.1 ? '↑' : d < -0.1 ? '↓' : '→';
          const color = d > 0.1 ? '#7FB069' : d < -0.1 ? '#E85D5D' : '#9BA3C2';
          return `<td style="text-align:right;padding:4px 8px;font-size:11px;color:#2D3142;">${v.toFixed(1)} <span style="color:${color}">${arrow}</span></td>`;
        })
        .join('');
      return `<tr style="border-bottom:1px solid #EFF2F7;">
        <td style="padding:4px 8px;font-size:11px;color:#2D3142;font-weight:600;">${s.name}</td>
        <td style="text-align:right;padding:4px 8px;font-size:11px;font-weight:700;color:${scoreColor(curr)};">${curr.toFixed(1)}</td>
        ${pastCells}
      </tr>`;
    })
    .join('');

  return `
  <table style="width:100%;border-collapse:collapse;margin-top:8px;">
    <thead>
      <tr style="background:#F7F9FB;">
        <th style="text-align:left;padding:4px 8px;font-size:10px;color:#6B7394;font-weight:600;">Subscale</th>
        <th style="text-align:right;padding:4px 8px;font-size:10px;color:#6B5B95;font-weight:600;">Current</th>
        ${headerCols}
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}

export function generateMaia2Html(input: Maia2PdfInput): string {
  const { subscaleScores, assessmentDate, userName, pastAssessments } = input;
  const hasPast = pastAssessments && pastAssessments.length > 0;
  const prevScores = hasPast ? pastAssessments![0].subscaleScores : undefined;
  const overall =
    MAIA2_SCALE.subscales.reduce((s, sub) => s + (subscaleScores[sub.key] ?? 0), 0) /
    MAIA2_SCALE.subscales.length;

  const safeDate = esc(assessmentDate);
  const safeName = userName ? esc(userName) : null;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>MAIA-2 Report — ${safeDate}</title>
  <style>
    @media print {
      body { margin: 0; }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #2D3142;
      background: #fff;
      margin: 0;
      padding: 0;
    }
    .page {
      max-width: 750px;
      margin: 0 auto;
      padding: 36px 40px;
    }
    .header-bar {
      background: linear-gradient(135deg, #6B5B95, #88B3B5);
      border-radius: 12px;
      padding: 24px 28px;
      color: white;
      margin-bottom: 28px;
    }
    .header-bar h1 {
      margin: 0 0 4px;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.3px;
    }
    .header-bar p {
      margin: 0;
      font-size: 13px;
      opacity: 0.85;
    }
    .meta-row {
      display: flex;
      gap: 24px;
      margin-bottom: 28px;
      flex-wrap: wrap;
    }
    .meta-item {
      background: #F7F9FB;
      border-radius: 10px;
      padding: 12px 16px;
      min-width: 140px;
    }
    .meta-label {
      font-size: 10px;
      color: #9BA3C2;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .meta-value {
      font-size: 15px;
      font-weight: 700;
      color: #2D3142;
    }
    .section-title {
      font-size: 13px;
      font-weight: 700;
      color: #6B5B95;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin: 24px 0 14px;
      padding-bottom: 6px;
      border-bottom: 2px solid #E4E9F2;
    }
    .two-col {
      display: flex;
      gap: 28px;
      align-items: flex-start;
    }
    .radar-col {
      flex-shrink: 0;
    }
    .bars-col {
      flex: 1;
      min-width: 0;
    }
    .disclaimer {
      background: #F7F9FB;
      border-radius: 10px;
      padding: 14px 16px;
      margin-top: 24px;
      font-size: 10px;
      color: #9BA3C2;
      line-height: 1.6;
    }
    .disclaimer strong {
      color: #6B7394;
    }
    .print-btn {
      display: inline-block;
      background: #6B5B95;
      color: white;
      border: none;
      border-radius: 10px;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      margin-bottom: 20px;
    }
    .print-btn:hover { background: #524578; }
  </style>
</head>
<body>
  <div class="page">
    <div class="no-print" style="text-align:right;margin-bottom:8px;">
      <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
    </div>

    <div class="header-bar">
      <h1>MAIA-2 Body Awareness Report</h1>
      <p>Multidimensional Assessment of Interoceptive Awareness &bull; Interosense</p>
    </div>

    <div class="meta-row">
      ${safeName ? `<div class="meta-item"><div class="meta-label">Client</div><div class="meta-value">${safeName}</div></div>` : ''}
      <div class="meta-item"><div class="meta-label">Assessment Date</div><div class="meta-value">${safeDate}</div></div>
      <div class="meta-item"><div class="meta-label">Subscale Average</div><div class="meta-value">${overall.toFixed(2)} / 5</div></div>
      <div class="meta-item"><div class="meta-label">Instrument</div><div class="meta-value">MAIA-2 (37 items)</div></div>
    </div>

    <div class="section-title">8-Dimension Profile</div>
    <div class="two-col">
      <div class="radar-col">${radarSvg(subscaleScores)}</div>
      <div class="bars-col">${subscaleBars(subscaleScores, prevScores)}</div>
    </div>

    ${
      hasPast
        ? `<div class="section-title" style="margin-top:28px;">Longitudinal History</div>
           <p style="font-size:11px;color:#9BA3C2;margin:0 0 8px;">Arrows show direction of change from past assessment to current. Up arrow = improvement.</p>
           ${longitudinalTable(pastAssessments!, subscaleScores)}`
        : ''
    }

    <div class="disclaimer">
      <strong>Clinical Note:</strong> The MAIA-2 (Mehling et al., 2018, PLOS ONE) is a validated 37-item self-report instrument measuring interoceptive awareness across 8 dimensions. Authors explicitly caution against computing a single composite score — the 8-subscale profile is the clinically meaningful unit. This report is intended as a clinical support document and does not constitute a diagnosis.<br/>
      <strong>Citation:</strong> Mehling WE et al. (2018). The Multidimensional Assessment of Interoceptive Awareness, Version 2 (MAIA-2). PLOS ONE 13(12): e0208034.<br/>
      <strong>Generated:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} via Interosense
    </div>
  </div>
</body>
</html>`;
}

export async function exportMaia2Pdf(input: Maia2PdfInput): Promise<void> {
  const html = generateMaia2Html(input);

  if (Platform.OS === 'web') {
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
    }
    return;
  }

  try {
    const Print = await import('expo-print');
    const Sharing = await import('expo-sharing');

    const { uri } = await Print.printToFileAsync({ html, base64: false });

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share MAIA-2 Report',
        UTI: 'com.adobe.pdf',
      });
    } else {
      Alert.alert('PDF saved', 'Your MAIA-2 report has been saved as a PDF.');
    }
  } catch (err: any) {
    Alert.alert('Export failed', err?.message ?? 'Could not generate PDF. Please try again.');
  }
}
