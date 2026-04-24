function BrandMark({ compact = false }) {
  return (
    <div className={`brand-mark${compact ? ' brand-mark--compact' : ''}`}>
      <img
        alt="SL Instruments"
        className="brand-mark__image"
        src="https://res.cloudinary.com/dquk8vwxi/image/upload/v1771474396/SL_Square_ooor6j.png"
      />
      <div className="brand-mark__copy">
         <strong>SL Instruments</strong>
        <span>Technical Research Lab</span>
      </div>
    </div>
  )
}

export default BrandMark
