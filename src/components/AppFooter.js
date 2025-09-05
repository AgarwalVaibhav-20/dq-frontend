import React from 'react'
import { CFooter } from '@coreui/react'

const AppFooter = () => {
  return (
    <CFooter className=" shadow-sm py-3">
      <div className="w-100 d-flex flex-column flex-md-row justify-content-center align-items-center gap-2">
        <a
          href="https://letsdq.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="fw-bold text-decoration-none text-primary"
        >
          DQ
        </a>
        <span className="text-muted">|</span>
        <span className="text-muted">
          © {new Date().getFullYear()} &nbsp; Created by{' '}
          <span className="fw-semibold">DQ Developers</span>
        </span>
      </div>
    </CFooter>
  )
}

export default React.memo(AppFooter)
