function BrandMark({ compact = false }) {
  return (
    <div className={`brand-mark${compact ? ' brand-mark--compact' : ''}`}>
      <img
        alt="SidLabs logo"
        className="brand-mark__image"
        src="https://res.cloudinary.com/dquk8vwxi/image/upload/v1771474396/SL_Square_ooor6j.png"
      />
      <div className="brand-mark__copy">
        <strong>SidLabs</strong>
        <span>This research is powered by SidLabs LLP</span>
      </div>
    </div>
  )
}

export default BrandMark
