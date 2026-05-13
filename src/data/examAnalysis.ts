import examAnalysisRaw from './examAnalysis.json';

interface SingleAnalysis {
  killer_questions: number[];
  question_concepts: Record<string, string>;
  exam_summary: string;
  key_concepts: string[];
  difficulty_notes: Record<string, string>;
  _label: string;
  _url: string;
}

interface PostAnalysisRaw {
  slug: string;
  analyses: SingleAnalysis[];
  tokens: { input: number; output: number };
}

export interface ExamAnalysis {
  killer_questions: number[];           // 모든 과목 합산 (중복 제거)
  question_concepts: Record<string, string>;
  exam_summary: string;
  key_concepts: string[];               // 모든 과목 합산 (중복 제거)
  difficulty_notes: Record<string, string>;
  subjects: string[];                   // 분석된 과목명 목록
}

const raw = examAnalysisRaw as PostAnalysisRaw[];

/** slug로 통합된 AI 분석 데이터를 반환. 없으면 null. */
export function getExamAnalysis(slug: string): ExamAnalysis | null {
  const entry = raw.find((r) => r.slug === slug);
  if (!entry || entry.analyses.length === 0) return null;

  const killerSet = new Set<number>();
  const conceptsMap: Record<string, string> = {};
  const keyConceptSet = new Set<string>();
  const diffNotes: Record<string, string> = {};
  const subjects: string[] = [];

  // 가장 긴 총평 선택
  let bestSummary = '';

  for (const a of entry.analyses) {
    a.killer_questions.forEach((n) => killerSet.add(n));
    Object.assign(conceptsMap, a.question_concepts);
    a.key_concepts.forEach((c) => keyConceptSet.add(c));
    Object.assign(diffNotes, a.difficulty_notes);
    if (a.exam_summary.length > bestSummary.length) bestSummary = a.exam_summary;
    if (a._label) subjects.push(a._label.replace(' 문제지 PDF', '').replace(' PDF', ''));
  }

  return {
    killer_questions: [...killerSet].sort((a, b) => a - b),
    question_concepts: conceptsMap,
    exam_summary: bestSummary,
    key_concepts: [...keyConceptSet],
    difficulty_notes: diffNotes,
    subjects,
  };
}
