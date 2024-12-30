import React from 'react'
import PropTypes from 'prop-types';
import {get, sortBy, isFunction} from 'lodash'
import memoizeOne from 'memoize-one';
import { withStyles } from '@material-ui/core/styles';

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import TableFooter from '@material-ui/core/TableFooter';

import TextField from '@material-ui/core/TextField';

import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete'
import EditIcon from '@material-ui/icons/Edit'
import FilterNoneIcon from '@material-ui/icons/FilterNone'
import SaveIcon from '@material-ui/icons/Save'
import UndoIcon from '@material-ui/icons/Undo'

import ActivityIndicator from 'common/ActivityIndicator'
import DayPicker from 'common/DayPicker'

import { MenuItem } from '@material-ui/core';

const styles = theme => ({
  root: {
    width: '100%',
    marginTop: theme.spacing.unit * 3,
    overflowX: 'auto',
  },
  table: {
    minWidth: 700
  },
  bigCell: {
    fontSize: '1.25rem',
    textAlign: 'right',
    whiteSpace: 'pre-line',
    padding: theme.spacing.unit * 1.5,
    width: '50%'
  },
  smallCell: {
    fontSize: '1.25rem',
    textAlign: 'right',
    padding: theme.spacing.unit * 1.5,
    whiteSpace: 'nowrap'
  },
  footerCell: {
    fontSize: '1.25rem',
    textAlign: 'right',
    padding: theme.spacing.unit * 1.5,
    whiteSpace: 'nowrap'
  },
  input: {
    fontSize: '1.25rem',
  },
  fullWidth: {
    width: '100%'
  },
  monthSelection: {
    marginTop: theme.spacing.unit * 1.5
  },
  newIcon: {
    marginLeft: theme.spacing.unit
  }
})

class EditableTable extends React.Component {
  static propTypes = {
    headers: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      wide: PropTypes.bool,
      focus: PropTypes.bool,
      type: PropTypes.oneOf(['readonly', 'number', 'time', 'computed', 'date']),
      multiline: PropTypes.bool,
      select: PropTypes.oneOfType([PropTypes.array, PropTypes.func]),
      idField: PropTypes.string,
      displayField: PropTypes.string,
      transform: PropTypes.func
    })).isRequired,
    data: PropTypes.array.isRequired,
    idField: PropTypes.string,
    isNew: PropTypes.func,
    preventEdit: PropTypes.func,
    onDelete: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    onDuplicate: PropTypes.func,
    footerData: PropTypes.arrayOf(
      PropTypes.shape({
        cells: PropTypes.arrayOf(
          PropTypes.shape({
            content: PropTypes.node,
            colSpan: PropTypes.number,
          })
        ),
      })
    ),
  }

  static defaultProps = {
    idField: '_id',
    isNew: () => false,
    preventEdit: () => false,
    footerData: null
  }

  state = {
    orderBy: '',
    orderDirection: 'asc'
  }

  applySort(id) {
    const {orderBy, orderDirection} = this.state
    if (orderBy !== id) {
      this.setState({
        orderBy: id,
        orderDirection: 'asc'
      })
      return
    }

    this.setState({
      orderDirection: orderDirection === 'asc' ? 'desc' : 'asc'
    })
  }

  render() {
    const {classes, headers, data, idField, isNew, preventEdit, footerData, ...otherProps} = this.props
    const {orderBy, orderDirection} = this.state
    return (
      <Table>
        <TableHead>
          <TableRow>
            {headers.map(({id, title, wide, sortable}) => (
              <TableCell key={id} className={wide ? classes.bigCell : classes.smallCell}>
                {sortable ? (
                  <TableSortLabel
                    active={orderBy === id}
                    direction={orderDirection}
                    onClick={() => this.applySort(id)}
                  >
                    {title}
                  </TableSortLabel>
                ) : title}
              </TableCell>
            ))}
            <TableCell className={classes.smallCell}/>
          </TableRow>
        </TableHead>
        <TableBody>
          {getSortedData(data, headers.find(({id}) => id === orderBy), orderDirection).map(item => (
            <EditableRow
              key={item[idField]}
              headers={headers}
              isNew={isNew(item)}
              data={item}
              preventEdit={preventEdit(item)}
              {...otherProps}
            />
          ))}
        </TableBody>
        {footerData && (
          <TableFooter>
            {footerData.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {row.cells.map(({wide, content, colSpan}, cellIndex) => (
                  <TableCell key={cellIndex} colSpan={colSpan || 1} className={wide ? classes.bigCell : classes.smallCell}>
                    {content}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableFooter>
        )}
      </Table>
    )
  }
}

class _EditableRow extends React.Component {
  static propTypes = {
    headers: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      wide: PropTypes.bool,
      focus: PropTypes.bool,
      type: PropTypes.oneOf(['readonly', 'number', 'time', 'computed', 'date']),
      multiline: PropTypes.bool,
      select: PropTypes.oneOfType([PropTypes.array, PropTypes.func]),
      idField: PropTypes.string,
      displayField: PropTypes.string,
      transform: PropTypes.func
    })).isRequired,
    data: PropTypes.object.isRequired,
    isNew: PropTypes.bool,
    onDelete: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    onDuplicate: PropTypes.func,
    preventEdit: PropTypes.bool
  }

  static defaultProps = {
    preventEdit: false
  }

  state = {
    data: {},
    edit: false,
    saving: false,
    errorFields: []
  }

  constructor(props) {
    super(props)
    this.state.data = props.data
    this.state.edit = props.isNew
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.data !== this.props.data) {
      this.setState({data: nextProps.data})
    }
  }

  componentWillUnmount() {
    this._unmonted = true
  }

  edit() {
    this.setState({
      edit: true,
      errorFields: []
    })
  }

  async delete() {
    this.setState({saving: true})
    try {
      await this.props.onDelete(this.props.data)
    } catch(err) {
    }
    if (!this._unmonted) {
      this.setState({saving: false})
    }
  }

  async save() {
    this.setState({saving: true})
    try {
      const data = await this.props.onSave(this.state.data)
      if (this._unmonted) {
        return
      }
      if (data) {
        this.setState({
          data,
          saving: false,
          edit: false,
          errorFields: [],
        })
      } else {
        this.setState({
          saving: false,
          edit: false,
          errorFields: []
        })
      }
    } catch (err) {
      this.setState({
        saving: false
      })
      const fields = get(err, 'response.data.fields')
      if (fields) {
        this.setState({
          errorFields: Object.keys(fields)
        })
      }
    }

  }

  discardChanged() {
    const {isNew, data} = this.props
    this.setState({
      data,
      edit: false,
      errorFields: []
    })

    if (isNew) {
      this.props.onDelete(this.props.data, true)
    }
  }

  focusOnInput(input) {
    input && input.focus()
  }

  updateData(key, value) {
    this.setState({
      data: {
        ...this.state.data,
        [key]: value
      }
    })
  }

  render() {
    const {classes, headers, preventEdit, onDuplicate} = this.props
    const {edit, saving, data, errorFields} = this.state
    return (
      <TableRow>
        {headers.map(({id, focus, type, select, multiline, wide, idField, displayField, transform}) => {
          const selectOptions = isFunction(select) ? select(data) : select
          return (
            <TableCell key={id} className={wide ? classes.bigCell : classes.smallCell}>
              {type === 'computed' ? transform(data) :
              (!edit || saving || type === 'readonly') ? (
                (select && selectOptions) ? (selectOptions.find(option => option[idField] === data[id]) || {})[displayField] : data[id]
              ) : (type === 'date') ? (
                <DayPicker
                  value={data[id]}
                  error={errorFields.includes(id)}
                  onDayChange={val => this.updateData(id, val.toISOString().split('T', 1)[0])}
                />
              ) : (
                <TextField
                  fullWidth
                  className={classes.input}
                  value={data[id] || ''}
                  inputRef={focus && this.focusOnInput}
                  onChange={e => this.updateData(id, e.target.value)}
                  multiline={multiline}
                  type={type}
                  select={!!select}
                  error={errorFields.includes(id)}
                >
                  {(selectOptions || []).map(option => (
                    <MenuItem key={option[idField]} value={option[idField]}>
                      {option[displayField]}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            </TableCell>
          )
        })}
        <TableCell className={classes.smallCell}>
          {(!edit && !saving && !preventEdit) && (
            <React.Fragment>
              {onDuplicate && <IconButton onClick={() => onDuplicate(data)}>
                <FilterNoneIcon />
              </IconButton>}
              <IconButton onClick={this.edit}>
                <EditIcon />
              </IconButton>
              <IconButton onClick={this.delete}>
                <DeleteIcon />
              </IconButton>
            </React.Fragment>
          ) }
          {saving && <ActivityIndicator />}
          {(edit && !saving) && (
            <React.Fragment>
              <IconButton onClick={this.save}>
                <SaveIcon />
              </IconButton>
              <IconButton onClick={this.discardChanged}>
                <UndoIcon />
              </IconButton>
            </React.Fragment>
          )}
        </TableCell>
      </TableRow>
    )
  }
}

const EditableRow = withStyles(styles)(_EditableRow)

const getSortedData = memoizeOne((data = [], orderHeader, orderDirection) => {
  if (!orderHeader) {
    return data
  }

  const {id, transform, select, displayField, idField} = orderHeader
  const orderBy = select ? (item) => ((isFunction(select) ? select(item) : select).find(option => option[idField] === data[id]) || {})[displayField] :
    transform || id

  const sortedData = sortBy(data, orderBy)
  if (orderDirection === 'desc') {
    sortedData.reverse()
  }
  return sortedData
})

export default withStyles(styles)(EditableTable)
