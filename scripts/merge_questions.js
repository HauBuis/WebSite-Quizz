const fs = require('fs');
const path = require('path');

const basePath = path.resolve(__dirname, '..');
const questionsFile = path.join(basePath, 'JSON', 'questions.json');
const generatedFile = path.join(basePath, 'JSON', 'questions_with_quiz.json');

function normalizeText(s) {
  if (!s && s !== '') return '';
  return String(s).trim().replace(/\s+/g, ' ').normalize();
}

function readJson(filePath) {
  try {
    let raw = fs.readFileSync(filePath, { encoding: 'utf8' });
  // loại BOM nếu có
    if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
    try {
      const parsed = JSON.parse(raw);
  // nếu là object chứa mảng `value` (PowerShell export), dùng mảng đó
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.value)) return parsed.value;
      return parsed;
    } catch (innerErr) {
  // phương án dự phòng: cố tìm '[' đầu tiên và parse phần sau (biện pháp cuối)
      const idx = raw.indexOf('[');
      if (idx !== -1) {
        const sub = raw.slice(idx);
        return JSON.parse(sub);
      }
      throw innerErr;
    }
  } catch (err) {
    console.error('Failed to read or parse', filePath, err.message);
    process.exit(2);
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), { encoding: 'utf8' });
}

function main() {
  if (!fs.existsSync(questionsFile)) {
    console.error('Base questions file not found:', questionsFile);
    process.exit(3);
  }
  if (!fs.existsSync(generatedFile)) {
    console.error('Generated questions file not found:', generatedFile);
    process.exit(4);
  }

  const base = readJson(questionsFile);
  const gen = readJson(generatedFile);

  if (!Array.isArray(base) || !Array.isArray(gen)) {
    console.error('Expected both files to contain JSON arrays. Aborting.');
    process.exit(5);
  }

  const map = new Map();
  base.forEach((q, idx) => {
    const key = normalizeText(q.questionText || q.text || q.title || ('#' + idx));
    map.set(key, q);
  });

  let processed = 0;
  let added = 0;
  let enriched = 0;

  // Chỉ xử lý các mục sinh ra có trường quizTitle — đây là các câu hỏi gán theo từng đề
  const genFiltered = gen.filter(x => x && x.quizTitle);

  genFiltered.forEach(gq => {
    processed++;
    const key = normalizeText(gq.questionText || gq.text || gq.title || '');
    if (!key) return;
    const existing = map.get(key);
    if (!existing) {
  // thêm một bản sao sạch (bỏ _id và __v nếu có)
      const copy = Object.assign({}, gq);
      delete copy._id;
      delete copy.__v;
      base.push(copy);
      map.set(key, copy);
      added++;
    } else {
  // bổ sung các trường thiếu cho mục đã tồn tại
      let changed = false;
      ['quizTitle', 'difficulty', 'subject', 'options', 'correctAnswer'].forEach(f => {
        if ((existing[f] === undefined || existing[f] === null || existing[f] === '') && gq[f] !== undefined) {
          existing[f] = gq[f];
          changed = true;
        }
      });
  // nếu options tồn tại nhưng số lượng khác nhau, ưu tiên bản có 4 phương án
      if (Array.isArray(existing.options) && Array.isArray(gq.options)) {
        if (existing.options.length < 4 && gq.options.length === 4) {
          existing.options = gq.options;
          changed = true;
        }
      }
      if (changed) enriched++;
    }
  });

  writeJson(questionsFile, base);

  console.log('Merge complete. Summary:');
  console.log('  originalCount:', map.size - added + (added ? 0 : 0));
  console.log('  generatedProcessed:', processed);
  console.log('  added:', added);
  console.log('  enrichedExisting:', enriched);
  console.log('  finalTotal:', base.length);
}

main();
