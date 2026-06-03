"use client";

import { designSampleInputs } from "@/lib/fermentationDesigner";
import { difficultyOptions, type Difficulty } from "@/types/fermentation";
import {
  designPreferenceOptions,
  designPurposeOptions,
  type DesignPreference,
  type DesignPurpose,
  type FermentationDesignInput,
} from "@/types/design";

type DesignFormProps = {
  input: FermentationDesignInput;
  onChange: (input: FermentationDesignInput) => void;
  onSubmit: () => void;
  onSampleSelect: (input: FermentationDesignInput) => void;
};

const sampleLabels = ["柚子ひよこ豆", "白菜乳酸", "米甘酒", "大豆おかず", "魚保存"];

export function DesignForm({ input, onChange, onSubmit, onSampleSelect }: DesignFormProps) {
  function update<K extends keyof FermentationDesignInput>(key: K, value: FermentationDesignInput[K]) {
    onChange({ ...input, [key]: value });
  }

  return (
    <section className="panel" aria-labelledby="design-form-title">
      <h2 className="panel-title" id="design-form-title">
        入力フォーム
      </h2>

      <div className="sample-row" aria-label="代表例">
        <span className="sample-prefix">サンプル：</span>
        {designSampleInputs.map((sample, index) => (
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
            <label htmlFor="purpose">目的</label>
            <select id="purpose" value={input.purpose} onChange={(event) => update("purpose", event.target.value as DesignPurpose)}>
              {designPurposeOptions.map((purpose) => (
                <option key={purpose} value={purpose}>
                  {purpose}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="preference">好み</label>
            <select id="preference" value={input.preference} onChange={(event) => update("preference", event.target.value as DesignPreference)}>
              {designPreferenceOptions.map((preference) => (
                <option key={preference} value={preference}>
                  {preference}
                </option>
              ))}
            </select>
          </div>
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

        <label className="checkbox-row" htmlFor="suggestSubIngredients">
          <input
            id="suggestSubIngredients"
            type="checkbox"
            checked={input.suggestSubIngredients}
            onChange={(event) => update("suggestSubIngredients", event.target.checked)}
          />
          <span>副材料提案あり</span>
        </label>

        <button className="primary-button" type="submit">
          発酵案を提案する
        </button>
      </form>
    </section>
  );
}
