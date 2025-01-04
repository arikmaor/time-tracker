import React from 'react';
import { without } from 'lodash';
import PropTypes from 'prop-types';

import { withStyles } from '@mui/styles';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';

import ActivityIndicator from 'common/ActivityIndicator';
import EditableTable from 'common/EditableTable';

import * as activitiesService from 'core/activitiesService';


const NEW_PREFIX = 'new_'

const styles = (theme) => ({
  root: {
    width: '100%',
    marginTop: theme.spacing(3), // Updated spacing API
    overflowX: 'auto',
  },
  table: {
    minWidth: 700,
  },
  bigCell: {
    fontSize: '1.25rem',
    textAlign: 'right',
    padding: theme.spacing(1.5), // Updated spacing API
    width: '50%',
  },
  smallCell: {
    fontSize: '1.25rem',
    textAlign: 'right',
    padding: theme.spacing(1.5), // Updated spacing API
    whiteSpace: 'nowrap',
  },
  input: {
    fontSize: '1.25rem',
  },
  fullWidth: {
    width: '100%',
  },
  monthSelection: {
    marginTop: theme.spacing(1.5), // Updated spacing API
  },
  newIcon: {
    marginLeft: theme.spacing(1), // Updated spacing API
  },
});

let dummyIdCouter = 0

class Activities extends React.Component {

  static propTypes = {
    classes: PropTypes.object.isRequired,
  };

  state = {
    loading: true,
    activities: []
  }

  constructor(props) {
    super(props)
    this.init()
  }

  async init() {
    const activities = await activitiesService.getAllActivities()
    this.setState({
      activities,
      loading: false
    })
  }

  async deleteActivity(activity) {
    if (!this.isNew(activity)) {
      if (!confirm('האם אתה בטוח שברצונך למחוק את הפעילות?')) {
        return
      }

      await activitiesService.deleteActivity(activity._id)
    }

    this.setState({
      activities: without(this.state.activities, activity)
    })
  }

  addNewActivity() {
    this.setState({
      activities: [
        {
          _id: NEW_PREFIX + (dummyIdCouter++),
          name: '',
          notes: '',
        },
        ...this.state.activities
      ],
    })
  }

  async saveActivity(activity) {
    const {_id, ...data} = activity
    const updatedActivity = this.isNew(activity) ?
      await activitiesService.addActivity(data) :
      await activitiesService.updateActivity(_id, data)

    return updatedActivity
  }

  isNew(activity) {
    return activity._id.startsWith(NEW_PREFIX)
  }

  render() {
    const {classes} = this.props;
    const {loading, activities} = this.state

    if (loading) {
      return <ActivityIndicator />
    }

    return (
      <div>
        <Button onClick={this.addNewActivity} variant="contained" color="primary">
          <AddIcon className={classes.newIcon}/>
          פעילות חדשה
        </Button>
        <Paper className={classes.root}>
          <EditableTable
            headers={[{
              id: 'name',
              title: 'פעילות',
              wide: true,
              focus: true
            }, {
              id: 'notes',
              title: 'הערות',
              wide: true,
              multiline: true
            }]}
            data={activities}
            isNew={this.isNew}
            onSave={this.saveActivity}
            onDelete={this.deleteActivity}
          />
        </Paper>
      </div>
    );
  }
}

export default withStyles(styles)(Activities);
