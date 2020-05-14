import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import queryString from 'query-string';
import { withRouter } from 'react-router-dom';
import { Form, FormGroup, Label, Input } from 'reactstrap';

import { ImageUploader } from 'components';
import Select from 'react-select';
import ModalWrapper from '../ModalWrapper';

// import Actions
import { addItem1 } from 'services/item/itemActions';
import { getMenus } from 'services/menu/menuActions';
import { getRestaurants } from 'services/restaurant/restaurantActions';

// Import Settings
import settings from 'config/settings';

class ItemAdd extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
    };
    this.submit_data = { order: 1 };

    this.onChange = this.onChange.bind(this);
    this.onLoad = this.onLoad.bind(this);
    this.onMenuChange = this.onMenuChange.bind(this);
    this.onRestaurantChange = this.onRestaurantChange.bind(this);
  }

  componentDidMount() {
    this.props.restaurantActions.getRestaurants();
    this.props.menuActions.getMenus();
  }

  onChange(e) {
    this.submit_data = {
      ...this.submit_data,
      [e.target.name]: e.target.value
    };
  }

  onLoad(file, file_type, file_name) {
    this.submit_data = {
      ...this.submit_data,
      file,
      file_type,
      file_name
    };
  }

  onMenuChange(menu) {
    this.setState({
      menu
    });
  }

  onRestaurantChange(e) {
    /* eslint-disable-next-line */
    if (e.target.value != -1) {
      this.props.menuActions.getMenus({
        restaurant: e.target.value
      });
    } else {
      this.props.menuActions.getMenus();
    }
  }

  onMenuOptions(menus) {
    if (menus && menus.data) {
      const options = menus.data.map(menu => {
        return {
          value: menu.id,
          label: `${menu.name} (${menu.restaurant.name})`
        };
      });
      return (
        <Select options={options} onChange={this.onMenuChange} />
      );
    }
  }

  renderRestaurantOptions(restaurants) {
    if (restaurants !== null) {
      return restaurants.data.map((restaurant, index) => (
        <option value={restaurant.id} key={index}>
          {restaurant.name}
        </option>
      ));
    }
  }

  render() {
    return (
      <ModalWrapper
        title="Item add"
        okText="Submit"
        onOk={() => {
          const params = queryString.parse(this.props.location.search);

          const item = {
            name: this.submit_data.name,
            menu_id : this.state.menu.value,
            price: parseFloat(this.submit_data.price) * settings.INTEGER_PRECISION,
            order: this.submit_data.order,
            file: this.submit_data.file,
            file_type: this.submit_data.file_type,
            file_name: this.submit_data.file_name
          };

          this.props.itemActions.addItem1(item, params);
        }}
      >
        <Form className="mt-3">
          {/* Item name here */}
          <FormGroup>
            <Label for="name"> Name </Label>
            <Input
              type="text"
              name="name"
              id="name"
              placeholder="Item name here"
              onChange={this.onChange}
            />
          </FormGroup>

          {/* Restaurant */}
          <FormGroup>
            <Label for="restaurant_id">Restaurant</Label>
            <Input
              type="select"
              name="restaurant_id"
              id="restaurant_id"
              onChange={this.onRestaurantChange}
            >
              <option value="-1"> No select </option>
              {this.renderRestaurantOptions(this.props.restaurant.restaurants)}
            </Input>
          </FormGroup>

          {/* Menu Select form */}
          <Label for="menu">Menu</Label>
          {this.onMenuOptions(this.props.menu.menus)}
          &nbsp;&nbsp;
          {/* Item price here */}
          <FormGroup>
            <Label for="price"> Price </Label>
            <Input
              type="text"
              name="price"
              id="price"
              placeholder="Item price here"
              onChange={this.onChange}
            />
          </FormGroup>

          {/* Order */}
          <FormGroup>
            <Label for="order">Order</Label>
            <Input
              type="text"
              name="order"
              id="order"
              placeholder="Order"
              defaultValue={1}
              onChange={this.onChange}
            />
          </FormGroup>

          {/* Image Upload form*/}
          <ImageUploader
            style={{
              position: 'relative',
              width: '100%',
              height: 'auto',
              minHeight: '300px',
              borderWidth: '2px',
              borderColor: 'rgb(102, 102, 102)',
              borderStyle: 'dashed',
              borderRadius: '5px'
            }}
            handleOnLoad={this.onLoad}
          />
        </Form>
      </ModalWrapper>
    );
  }
}

ItemAdd = withRouter(ItemAdd);

export default connect(
  state => ({
    menu: {
      ...state.default.services.menu
    },
    restaurant: {
      ...state.default.services.restaurant
    }
  }),
  dispatch => ({
    itemActions: bindActionCreators({ addItem1 }, dispatch),
    menuActions: bindActionCreators({ getMenus }, dispatch),
    restaurantActions: bindActionCreators({ getRestaurants }, dispatch)
  })
)(ItemAdd);
