import { useI18n } from '../../i18n/useI18n';

interface RulesModalProps {
  onClose: () => void;
}

export default function RulesModal({ onClose }: RulesModalProps) {
  const { t } = useI18n();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card rules-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('rules.title')}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <section>
            <h3>{t('rules.goalTitle')}</h3>
            <p>{t('rules.goalText')}</p>
          </section>

          <section>
            <h3>{t('rules.turnTitle')}</h3>
            <ol>
              <li>{t('rules.turn1')}</li>
              <li>{t('rules.turn2')}</li>
              <li>{t('rules.turn3')}</li>
            </ol>
          </section>

          <section>
            <h3>{t('rules.receiveTitle')}</h3>
            <p>{t('rules.receiveText')}</p>
            <ul>
              <li>{t('rules.receiveTrue')}</li>
              <li>{t('rules.receiveFalse')}</li>
              <li>{t('rules.receivePeek')}</li>
            </ul>
          </section>

          <section>
            <h3>{t('rules.royalTitle')}</h3>
            <p>{t('rules.royalText')}</p>
          </section>

          <section>
            <h3>{t('rules.overTitle')}</h3>
            <p>{t('rules.overText')}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
