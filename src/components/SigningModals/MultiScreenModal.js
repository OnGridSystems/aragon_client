import React, { useCallback, useState } from 'react'
import PropTypes from 'prop-types'
import {
  Modal,
  noop,
  Viewport,
  springs,
  textStyle,
  useViewport,
  GU,
} from '@aragon/ui'
import { Spring, Transition, animated } from 'react-spring'
import { useSteps } from '../../hooks'

const AnimatedDiv = animated.div

const DEFAULT_MODAL_WIDTH = 85 * GU

function MultiScreenModal({ visible, screens, onClose }) {
  const steps = screens.length
  const { prev, step, next, direction } = useSteps(steps)

  const [applyStaticHeight, setApplyStaticHeight] = useState(false)
  const [height, setHeight] = useState(null)
  const [firstStart, setFirstStart] = useState(true)
  const { below } = useViewport()

  const smallMode = below('medium')
  const { disableClose, width } = screens[step]

  const modalWidth = width || DEFAULT_MODAL_WIDTH

  const renderScreen = useCallback(
    step => {
      const { title, content } = screens[step]

      return (
        <React.Fragment>
          <h1
            css={`
              ${smallMode ? textStyle('title4') : textStyle('title3')};

              margin-top: -${1 * GU}px;
              margin-bottom: ${2 * GU}px;
            `}
          >
            {title}
          </h1>
          {content({
            prevScreen: prev,
            nextScreen: next,
            closeModal: onClose,
          })}
        </React.Fragment>
      )
    },
    [prev, next, onClose, screens, smallMode]
  )

  const onStart = useCallback(() => {
    // Don’t animate or set the static height when the modal first opens
    if (firstStart) {
      setFirstStart(false)

      return
    }

    setApplyStaticHeight(true)
  }, [firstStart])

  const handleModalClose = useCallback(() => {
    if (!disableClose) {
      onClose()
    }
  }, [disableClose, onClose])

  return (
    <Viewport>
      {({ width }) => {
        // Apply a small gutter when matching the viewport width
        const viewportWidth = width - 4 * GU

        return (
          <Modal
            padding={0}
            width={Math.min(viewportWidth, modalWidth)}
            onClose={handleModalClose}
            visible={visible}
            closeButton={!disableClose}
          >
            <Spring
              config={springs.swift}
              to={{ height }}
              immediate={firstStart}
              native
            >
              {({ height }) => (
                <AnimatedDiv
                  style={{
                    position: 'relative',
                    height: applyStaticHeight ? height : 'auto',
                  }}
                >
                  <Transition
                    config={(_, state) =>
                      state === 'leave' ? springs.instant : springs.smooth
                    }
                    items={step}
                    immediate={firstStart}
                    from={{
                      opacity: 0,
                      transform: `translate3d(${5 * GU * direction}px, 0, 0)`,
                    }}
                    enter={{
                      opacity: 1,
                      transform: 'translate3d(0, 0, 0)',
                    }}
                    leave={{
                      opacity: 0,
                      transform: `translate3d(${5 * GU * -direction}px, 0, 0)`,
                    }}
                    onRest={(_, status) => {
                      if (status === 'update') {
                        setApplyStaticHeight(false)
                      }
                    }}
                    onStart={onStart}
                    native
                  >
                    {currentStep => ({ opacity, transform }) => {
                      // For better performance we avoid reflows between screen changes by matching the screen width with the modal width
                      const screenWidth =
                        screens[currentStep].width || DEFAULT_MODAL_WIDTH

                      return (
                        <AnimatedDiv
                          ref={elt => {
                            if (elt) {
                              setHeight(elt.clientHeight)
                            }
                          }}
                          style={{
                            position:
                              currentStep === step ? 'static' : 'absolute',
                            transform: transform,
                            opacity: opacity,
                            width: Math.min(viewportWidth, screenWidth),
                            padding: smallMode ? 3 * GU : 5 * GU,
                          }}
                        >
                          {renderScreen(currentStep)}
                        </AnimatedDiv>
                      )
                    }}
                  </Transition>
                </AnimatedDiv>
              )}
            </Spring>
          </Modal>
        )
      }}
    </Viewport>
  )
}

MultiScreenModal.defaultProps = {
  onClose: noop,
}

MultiScreenModal.propTypes = {
  visible: PropTypes.bool,
  screens: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string,
      content: PropTypes.func,
      disableClose: PropTypes.bool,
      width: PropTypes.number,
    })
  ).isRequired,
  onClose: PropTypes.func,
}

export default React.memo(MultiScreenModal)