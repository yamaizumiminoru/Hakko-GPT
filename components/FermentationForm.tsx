"use client";

import { sampleInputs } from "@/lib/fermentationRules";
import {
  difficultyOptions,
  starterOptions,
  type Difficulty,
  type FermentationInput,
  type Starter,
} from "@/types/fermentation";

type FermentationFormProps = {
  input: FermentationInput;
  onChange: (input: FermentationInput) => void;
  onSubmit: () => void;
  onSampleSelect: (input: FermentationInput) => void;
};

const sampleLabels = [
  "柚子ひよこ豆",
  "バナナ納豆菌",
  "大豆納豆",
  "米甘酒",
  "魚乳酸菌",
];

export function FermentationForm({ input, onChange, onSubmit, onSampleSelect }: FermentationFormProps) {
  function update<K extends keyof FermentationInput>(key: K, value: FermentationInput[K]) {
    onChange({ ...input, [key]: value });
  }

  return (
    <section className="panel" aria-labelledby="form-title">
      <h2 className="panel-title" id="form-title">
        入力フォーム
      </h2>

      <div className="sample-row" aria-label="代表例">
        <span className="sample-prefix">サンプル：</span>
        {sampleInputs.map((sample, index) => (
          <button className="sample-button" key={sampleLabels[index]} type="button" onClick={() => onSampleSelect(sample)}>
            {sampleLabels[index]}
          </button>
        ))}
      </div>

      <form
        className="form-grid"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="field">
          <label htmlFor="mainIngredient">主材料</label>
          <input
            id="mainIngredient"
            value={input.mainIngredient}
            onChange={(event) => update("mainIngredient", event.target.value)}
            placeholder="例：ひよこ豆"
          />
        </div>

        <div className="field">
          <label htmlFor="subIngredients">副材料</label>
          <textarea
            id="subIngredients"
            value={input.subIngredients}
            onChange={(event) => update("subIngredients", event.target.value)}
            placeholder="例：柚子、昆布、唐辛子"
          />
        </div>

        <div className="split-row">
          <div className="field">
            <label htmlFor="starter">発酵スターター</label>
            <select id="starter" value={input.starter} onChange={(event) => update("starter", event.target.value as Starter)}>
              {starterOptions.map((starter) => (
                <option key={starter} value={starter}>
                  {starter}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="difficulty">難易度</label>
            <select id="difficulty" value={input.difficulty} onChange={(event) => update("difficulty", event.target.value as Difficulty)}>
              {difficultyOptions.map((difficulty) => (
                <option key={difficulty} value={difficulty}>
                  {difficulty}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="split-row">
          <div className="field">
            <label htmlFor="purpose">目的</label>
            <input id="purpose" value={input.purpose} onChange={(event) => update("purpose", event.target.value)} placeholder="例：調味料" />
          </div>

          <div className="field">
            <label htmlFor="preference">好み</label>
            <input id="preference" value={input.preference} onChange={(event) => update("preference", event.target.value)} placeholder="例：旨味強め" />
          </div>
        </div>

        <div className="split-row">
          <div className="field">
            <label htmlFor="temperatureC">温度 ℃</label>
            <input
              id="temperatureC"
              type="number"
              value={input.temperatureC}
              onChange={(event) => update("temperatureC", Number(event.target.value))}
            />
          </div>

          <div className="field">
            <label htmlFor="humidity">湿度 %</label>
            <input id="humidity" type="number" value={input.humidity} onChange={(event) => update("humidity", Number(event.target.value))} />
          </div>
        </div>

        <div className="split-row">
          <div className="field">
            <label htmlFor="duration">期間</label>
            <input id="duration" value={input.duration} onChange={(event) => update("duration", event.target.value)} placeholder="例：8時間、10日" />
          </div>

          <div className="field">
            <label htmlFor="saltPercent">塩分 %</label>
            <input
              id="saltPercent"
              type="number"
              step="0.1"
              value={input.saltPercent}
              onChange={(event) => update("saltPercent", Number(event.target.value))}
            />
          </div>
        </div>

        <div className="checkbox-group">
          <label className="checkbox-row" htmlFor="sealed">
            <input id="sealed" type="checkbox" checked={input.sealed} onChange={(event) => update("sealed", event.target.checked)} />
            <span>密閉する</span>
          </label>

          <label className="checkbox-row" htmlFor="cooked">
            <input id="cooked" type="checkbox" checked={input.cooked} onChange={(event) => update("cooked", event.target.checked)} />
            <span>加熱済み</span>
          </label>
        </div>

        <button className="primary-button" type="submit">
          評価する
        </button>
      </form>
    </section>
  );
}
