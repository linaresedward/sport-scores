export default function Loading() {
  return (
    <main className="home-page">
      <div className="hero-section">
        <div className="skeleton skeleton--title" />
        <div className="skeleton skeleton--subtitle" />
      </div>

      <div className="matches-container">
        <div className="skeleton skeleton--label" />
        <div className="skeleton-card">
          <div className="skeleton-card__header">
            <div className="skeleton skeleton--badge" />
          </div>
          <div className="skeleton-card__body">
            <div className="skeleton-team">
              <div className="skeleton skeleton--logo" />
              <div className="skeleton skeleton--name" />
            </div>
            <div className="skeleton skeleton--score" />
            <div className="skeleton-team skeleton-team--right">
              <div className="skeleton skeleton--name" />
              <div className="skeleton skeleton--logo" />
            </div>
          </div>
        </div>

        <div className="skeleton skeleton--label" style={{ marginTop: '1.25rem' }} />
        <div className="skeleton-card">
          <div className="skeleton-card__header">
            <div className="skeleton skeleton--badge" />
          </div>
          <div className="skeleton-card__body">
            <div className="skeleton-team">
              <div className="skeleton skeleton--logo" />
              <div className="skeleton skeleton--name" />
            </div>
            <div className="skeleton skeleton--score" />
            <div className="skeleton-team skeleton-team--right">
              <div className="skeleton skeleton--name" />
              <div className="skeleton skeleton--logo" />
            </div>
          </div>
        </div>

        <div className="skeleton-card">
          <div className="skeleton-card__header">
            <div className="skeleton skeleton--badge" />
          </div>
          <div className="skeleton-card__body">
            <div className="skeleton-team">
              <div className="skeleton skeleton--logo" />
              <div className="skeleton skeleton--name" />
            </div>
            <div className="skeleton skeleton--score" />
            <div className="skeleton-team skeleton-team--right">
              <div className="skeleton skeleton--name" />
              <div className="skeleton skeleton--logo" />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}