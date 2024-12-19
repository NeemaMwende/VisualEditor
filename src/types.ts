// types.ts
interface Answer {
    text: string;
    isCorrect: boolean;
  }
  
  interface Question {
    id: number;
    title: string;
    question: string;
    answers: Answer[];
    isExpanded: boolean;
  }