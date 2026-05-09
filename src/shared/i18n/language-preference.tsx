import { languageOptions, useI18n } from './i18n';

export function LanguagePreferenceGate() {
  const { hasStoredLanguage, setLanguage, t } = useI18n();

  if (hasStoredLanguage) {
    return null;
  }

  return (
    <div className="language-gate" role="dialog" aria-modal="true" aria-labelledby="language-gate-title">
      <section className="language-gate__panel">
        <span className="eyebrow">Inter CRM</span>
        <h2 id="language-gate-title">{t('language.title')}</h2>
        <p>{t('language.subtitle')}</p>
        <p className="subtle">{t('language.description')}</p>
        <div className="language-gate__actions">
          {languageOptions.map(option => (
            <button
              key={option.value}
              type="button"
              className="language-option"
              onClick={() => setLanguage(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
