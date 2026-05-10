import { useLocation } from 'react-router-dom';

const steps = [
  { label: 'Афиша', match: '/events' },
  { label: 'Места', match: '/seats' },
  { label: 'Оплата', match: '/bookings/confirm' },
  { label: 'Готово', match: '/bookings/history' }
];

export default function BookingSteps({ done = false }) {
  const { pathname } = useLocation();
  const activeIndex = done
    ? 3
    : steps.findIndex((step) => (step.match === '/seats' ? pathname.includes(step.match) : pathname === step.match));

  return (
    <div className="steps" aria-label="Прогресс бронирования">
      {steps.map((step, index) => (
        <div className={`step ${index <= activeIndex ? 'active' : ''}`} key={step.label}>
          <span>{index + 1}</span>
          {step.label}
        </div>
      ))}
    </div>
  );
}
