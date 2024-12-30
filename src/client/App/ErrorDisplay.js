import React from 'react'
import {get} from 'lodash'
import {withRouter} from 'react-router-dom'
import {Snackbar, withStyles} from '@material-ui/core'
import apiClient from 'core/apiClient'
import {signOut} from 'core/authService'

const styles = theme => ({
  error: {
    marginTop: theme.spacing.unit,
    backgroundColor: theme.palette.error.dark
  }
})

class ErrorDisplay extends React.Component {

  state = {
    errorMessage: null
  }

  constructor(props) {
    super(props)
    apiClient.interceptors.response.use(null, error => {
      if (error.response.status === 401) {
        signOut()
        this.props.history.push('/login')
      } else {
        this.setState({
          errorMessage: get(error, 'response.data.error', 'unknown server error')
        })
      }
      return Promise.reject(error)
    })

  }

  handleClose() {
    this.setState({errorMessage: null})
  }

  render() {
    const {classes} = this.props
    const {errorMessage} = this.state

    return (
      <Snackbar
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        open={!!errorMessage}
        autoHideDuration={2000}
        onClose={this.handleClose}
        message={errorMessage}
        ContentProps={{
          className: classes.error
        }}
      />
    )
  }
}

export default withStyles(styles)(withRouter(ErrorDisplay))
