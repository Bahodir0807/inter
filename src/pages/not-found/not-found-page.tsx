import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../shared/i18n/i18n';

export function NotFoundPage() {
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <div className="not-found-page" style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>{t('notFound.title', 'Страница не найдена')}</h1>
      <p className="subtle">{t('notFound.description', 'Запрашиваемая страница не существует или была перемещена.')}</p>
      <div style={{ marginTop: '1.25rem' }}>
        <button type="button" className="btn btn-primary" onClick={() => navigate('/app/dashboard')}>
          {t('notFound.backToHome', 'Вернуться на главную')}
        </button>
      </div>
    </div>
  );
}

export default NotFoundPage;
