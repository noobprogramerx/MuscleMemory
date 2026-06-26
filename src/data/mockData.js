// src/data/mockData.js
/**
 * Mock data for training records
 */
const mockData = {
  exercises: [
    { id: "ex-1", name: "ベンチプレス", part: "CHEST" },
    { id: "ex-2", name: "インクラインダンベルプレス", part: "CHEST" },
    { id: "ex-3", name: "ショルダープレス", part: "SHOULDER" },
    { id: "ex-4", name: "サイドレイズ", part: "SHOULDER" },
    { id: "ex-5", name: "アームカール", part: "BYCEPS" },
    { id: "ex-6", name: "ラットプルダウン", part: "BACK" },
    { id: "ex-7", name: "プレスダウン", part: "TRICEPS" }
  ],
  records: [
    {
      exerciseId: "ex-1",
      date: "2026-06-20",
      sets: [
        { weight: 60, reps: 10 },
        { weight: 60, reps: 9 },
        { weight: 55, reps: 10 }
      ]
    },
    {
      exerciseId: "ex-3",
      date: "2026-06-20",
      sets: [
        { weight: 20, reps: 10 },
        { weight: 20, reps: 8 }
      ]
    }
  ]
};

export default mockData;
