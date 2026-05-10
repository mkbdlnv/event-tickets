const statusLabel = {
  available: 'доступно',
  locked: 'забронировано',
  sold: 'продано',
  selected: 'выбрано'
};

export default function SeatMap({ seats, selectedIds, onToggle }) {
  const grouped = seats.reduce((acc, seat) => {
    acc[seat.row_label] = acc[seat.row_label] || [];
    acc[seat.row_label].push(seat);
    return acc;
  }, {});

  return (
    <div className="seat-map">
      <div className="screen">Сцена / экран</div>
      {Object.entries(grouped).map(([row, rowSeats]) => (
        <div className="seat-row" key={row}>
          <div className="row-label">{row}</div>
          <div className="seat-grid">
            {rowSeats.map((seat) => {
              const selected = selectedIds.includes(seat.id);
              const visualStatus = selected ? 'selected' : seat.status;
              return (
                <button
                  key={seat.id}
                  className={`seat ${visualStatus}`}
                  disabled={seat.status !== 'available'}
                  onClick={() => onToggle(seat)}
                  title={`${row}${seat.seat_number}: ${statusLabel[visualStatus]}`}
                >
                  {seat.seat_number}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <div className="legend">
        <span><i className="available" /> Зеленый = Доступно</span>
        <span><i className="locked" /> Желтый = Забронировано</span>
        <span><i className="sold" /> Красный = Продано</span>
        <span><i className="selected" /> Синий = Выбрано</span>
      </div>
    </div>
  );
}
