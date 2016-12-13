import { Component } from 'substance'

class ToponymContextItem extends Component {

  render($$) {
    let el = $$('div')
      .addClass('sc-entity-entry se-toponym')
      .on('click', this.handleClick)
      .append(
        $$('div').addClass('se-title').append(this.props.data.name),
        $$('div').addClass('se-description').append(this.props.data.description)
      )

    return el
  }

  handleClick() {
    
  }

}

export default ToponymContextItem