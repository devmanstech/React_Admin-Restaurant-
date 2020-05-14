import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Table, Button, UncontrolledCollapse, Input } from 'reactstrap';
import Swal from 'sweetalert2';
import { withRouter } from 'react-router-dom';
import { toastr } from 'react-redux-toastr';
import CSVParse from 'csv-parse';
import moment from 'moment';

// Import components
import ImageUploader from './../ImageUploader';
import MenuEditModal from './../MenuEditModal';

// Import Actions
import { deleteMenu } from 'services/menu/menuActions';
import {
  addItem,
  addItems,
  deleteItem,
  addItems1,
  updateItem
} from 'services/item/itemActions';
import { getRestaurants } from 'services/restaurant/restaurantActions';

// Import Settings
import settings from 'config/settings';
import queryString from 'query-string';

const imageUploaderStyle = {
  position: 'relative',
  height: '50px',
  minHeight: '50px',
  maxHeight: '50px',
  borderWidth: '2px',
  borderColor: 'rgb(102, 102, 102)',
  borderStyle: 'dashed',
  borderRadius: '5px'
};

class MenuTable extends React.Component {
  constructor(props) {
    super(props);
    this.submitData = []; // menu item submit data
    this.editData = []; // menu item edit data
    this.modal_data = {}; // Modal dialog data

    this.state = {
      modal: false // modal dialog flag
    };

    this.renderMenuTable = this.renderMenuTable.bind(this);
    this.handleEdit = this.handleEdit.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
    this.handleOnLoad = this.handleOnLoad.bind(this);
    this.handleOnLoadForEdit = this.handleOnLoadForEdit.bind(this);
    this.handleEditMenuItem = this.handleEditMenuItem.bind(this);
    this.handleDeleteMenuItem = this.handleDeleteMenuItem.bind(this);
    this.renderSubmitItems = this.renderSubmitItems.bind(this);
    this.addMenuItemInput = this.addMenuItemInput.bind(this);
    this.handleUpdateMenuItem = this.handleUpdateMenuItem.bind(this);
    this.toggle = this.toggle.bind(this);
    this.onClickAddItemFromExcel = this.onClickAddItemFromExcel.bind(this);
    this.onChangeCSVFile = this.onChangeCSVFile.bind(this);
    this.onExportCSV = this.onExportCSV.bind(this);
  }

  componentDidMount() {
    this.props.restaurantActions.getRestaurants();
  }

  /**
   * Toggle modal dialog
   */
  toggle() {
    this.setState({
      modal: !this.state.modal
    });
  }

  handleEdit(id) {
    this.props.history.push(`/menus/${id}/edit`);
  }

  handleDelete(id) {
    Swal({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then(result => {
      if (result.value) {
        this.props.menuActions.deleteMenu(id);
      }
    });
  }

  handleOnLoad(file, file_type, file_name, menuId, inputItemIndex) {
    this.submitData[menuId][inputItemIndex] = {
      ...this.submitData[menuId][inputItemIndex],
      file,
      file_name,
      file_type
    };
  }

  handleOnLoadForEdit(file, file_type, file_name, menuId, inputItemIndex) {
    this.editData[menuId][inputItemIndex] = {
      ...this.editData[menuId][inputItemIndex],
      file,
      file_name,
      file_type
    };
  }

  handleMenuItemSubmit(id) {
    const items = this.submitData[id];

    const params = queryString.parse(this.props.location.search);

    this.props.itemActions.addItems(items, params);
  }

  /// Handle edit button click event
  handleEditMenuItem(id, e) {
    e.stopPropagation();
    this.props.history.push(`/items/${id}/edit`);
  }

  handleEditDataChange(menu_id, item_id, data) {
    if (!this.editData[menu_id]) {
      this.editData[menu_id] = [];
    }

    if (!this.editData[menu_id][item_id]) {
      this.editData[menu_id][item_id] = {};
    }

    this.editData[menu_id][item_id] = {
      ...this.editData[menu_id][item_id],
      ...data
    };
  }

  handleUpdateMenuItem(menu_id, item_id) {
    const params = queryString.parse(this.props.location.search);
    let data = {
      id: item_id,
      item: this.editData[menu_id][item_id],
      params
    };
    this.props.itemActions.updateItem(data);
  }

  /// Handle delete button click event
  handleDeleteMenuItem(id, e) {
    e.stopPropagation();
    Swal({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then(result => {
      if (result.value) {
        const params = queryString.parse(this.props.location.search);
        this.props.itemActions.deleteItem(id, params);
      }
    });
  }

  onClickAddItemFromExcel(menu_id) {
    localStorage.setItem("current_menu_id", menu_id);
    this.csvUploader.click();
  }

  onChangeCSVFile(event) {
    let file = event.target.files[0];
    if(file === undefined){
      return;
    }
    console.log(file);
    const filename = file.name;
    if(filename.substr(filename.length - 4, 4) !== ".csv"){
      toastr.warning('Warning', "Please select .csv file");
      return;
    }
    const fileReader = new FileReader();
    const output = [];
    fileReader.onload = () => {
      const params = queryString.parse(this.props.location.search);
      CSVParse(fileReader.result, {})
        .on('readable', function() {
          let record;
          while ((record = this.read())) {
            let item = {};
            if(record[6] === 'i'){
              item['created_at'] = moment().format('YYYY-MM-DD HH:mm:ss');
              item['updated_at'] = moment().format('YYYY-MM-DD HH:mm:ss');
              item['id'] = record[0];
              item['name'] = record[1];
              item['order'] = record[2];
              item['image_url'] = record[3];
              item['menu_id'] = localStorage.getItem("current_menu_id");
              item['price'] = parseFloat(record[5]) * settings.INTEGER_PRECISION;
              item['action'] = record[6];
              output.push(item);
            }
          }
        })
        .on('end', () => {
          console.log(output);
          if(output.length === 0){
            toastr.warning('Warning', "No operations in file");
            return;
          } else{
            this.props.itemActions.addItems(output, params);
          }
        });
    };
    fileReader.readAsText(file, "UTF-8");
  }

  downloadCSV(csv, filename) {
      var csvFile;
      var downloadLink;
      // CSV file
      csvFile = new Blob(["\ufeff"+csv], {type: "text/csv;charset=UTF-8"});
      // Download link
      downloadLink = document.createElement("a");
      // File name
      downloadLink.download = filename;
      // Create a link to the file
      downloadLink.href = window.URL.createObjectURL(csvFile);
      // Hide download link
      downloadLink.style.display = "none";
      // Add the link to DOM
      document.body.appendChild(downloadLink);
      // Click download link
      downloadLink.click();
  }

  exportTableToCSV(filename, menu_id) {
      var csv = [];
      csv.push(['Item_Id', 'Name', 'Order', 'Image Url', 'Menu_Id', 'Price', 'Act(i)'].join(','));
      var rows = document.querySelectorAll(".items_menu_" + menu_id);
      for (var i = 0; i < rows.length; i++) {
          var row = [], cols = rows[i].querySelectorAll(".item");
          row.push(cols[0].attributes[1].value); // Item_Id
          row.push(cols[0].innerText); // Name
          row.push(cols[0].attributes[2].value); // Order
          if(cols[0].attributes[3]){
            row.push(cols[0].attributes[3].value); // Image Url
          } else{
            row.push("");
          }
          row.push(menu_id); // Menu_Id
          row.push(cols[1].innerText); // Price
          row.push(""); // Operation
          csv.push(row.join(","));
      }
      // Download CSV file
      this.downloadCSV(csv.join("\n"), filename);
  }

  onExportCSV(menu_id){
    let self = this;
    setTimeout(function(){
      const filename = "Items_Menu_" + menu_id + ".csv"; 
      self.exportTableToCSV(filename, menu_id);
    }, 500);
  }

  renderMenuItems(item) {
    /// If edit data of this item is empty/undefined just initialize with {} object
    if (!this.editData[item.menu_id]) {
      this.editData[item.menu_id] = [];
    }

    if (!this.editData[item.menu_id][item.id]) {
      this.editData[item.menu_id][item.id] = {
        ...item
      };
    }
    ////////////////////////////////////////////////////////////////////////////

    return (
      <div className={"p-3 border-bottom items_menu_"+item.menu_id} key={item.id}>
        <div className="row">
          <div className="col-md-4 item" data_id={item.id} data_order={item.order} data_image_url={item.image_url}>{item.name}</div>
          <div className="col-md-4 item">
            {item.price / settings.INTEGER_PRECISION}
          </div>
          <div className="col-md-4">
            <Button
              size="sm"
              color="warning"
              id={`toggle_menu_item_edit_${item.menu_id}_${item.id}`}
            >
              <i className="fa fa-edit" />
            </Button>
            <Button
              size="sm"
              color="danger"
              onClick={e => {
                this.handleDeleteMenuItem(item.id, e);
              }}
            >
              <i className="fa fa-trash" />
            </Button>
          </div>
        </div>
        <UncontrolledCollapse
          toggler={`toggle_menu_item_edit_${item.menu_id}_${item.id}`}
        >
          <div className="row mt-3">
            <div className="col-md-3">
              <Input
                type="text"
                onChange={evt => {
                  this.handleEditDataChange(item.menu_id, item.id, {
                    name: evt.target.value
                  });
                }}
                placeholder="Name"
                defaultValue={item.name}
              />
            </div>
            <div className="col-md-3">
              <Input
                type="text"
                placeholder="Price"
                onChange={evt => {
                  this.handleEditDataChange(item.menu_id, item.id, {
                    price:
                      parseFloat(evt.target.value) * settings.INTEGER_PRECISION
                  });
                }}
                defaultValue={item.price / settings.INTEGER_PRECISION}
              />
            </div>
            <div className="col-md-3">
              <Input
                type="text"
                onChange={evt => {
                  this.handleEditDataChange(item.menu_id, item.id, {
                    order: evt.target.value
                  });
                }}
                defaultValue={item.order}
                placeholder="Order"
              />
            </div>
            <div className="col-md-3">
              <ImageUploader
                menuId={item.menu_id}
                inputItemIndex={item.id}
                style={imageUploaderStyle}
                image={item.image_url ? settings.BASE_URL + item.image_url : ''}
                handleOnLoad={this.handleOnLoadForEdit}
              />
            </div>
          </div>
          <div>
            <Button
              color="secondary"
              onClick={() => {
                this.handleUpdateMenuItem(item.menu_id, item.id);
              }}
            >
              <i className="fa fa-upload"> Update</i>
            </Button>
          </div>
        </UncontrolledCollapse>
      </div>
    );
  }

  addMenuItemInput(menuId) {
    if (this.submitData[menuId]) {
    } else {
      this.submitData[menuId] = [];
    }

    let defaultItem = {
      order: 1,
      menu_id: menuId
    };
    
    if (this.submitData[menuId].length == 1){
      return;
    }
    this.submitData[menuId].push(defaultItem);
    this.forceUpdate();
  }

  renderSubmitItems(menu) {
    if (this.submitData[menu.id] && this.submitData[menu.id].length > 0) {
      // eslint-disable-next-line
      return this.submitData[menu.id].map((item, index) => (
        <div className="row p-3" key={index}>
          <div className="col-md-3">
            <Input
              type="text"
              onChange={evt => {
                this.submitData[menu.id][index] = {
                  ...this.submitData[menu.id][index],
                  name: evt.target.value
                };
              }}
              placeholder="Name"
            />
          </div>
          <div className="col-md-3">
            <Input
              type="text"
              placeholder="Price"
              onChange={evt => {
                this.submitData[menu.id][index] = {
                  ...this.submitData[menu.id][index],
                  price:
                    parseFloat(evt.target.value) * settings.INTEGER_PRECISION
                };
              }}
            />
          </div>
          <div className="col-md-3">
            <Input
              type="text"
              onChange={evt => {
                this.submitData[menu.id][index] = {
                  ...this.submitData[menu.id][index],
                  order: evt.target.value
                };
              }}
              defaultValue={1}
              placeholder="Name"
            />
          </div>
          <div className="col-md-3">
            <ImageUploader
              menuId={menu.id}
              inputItemIndex={index}
              style={imageUploaderStyle}
              handleOnLoad={this.handleOnLoad}
            />
          </div>
        </div>
      ));
    }
  }

  renderMenuTable() {
    const { data } = this.props;
    if (data && data.length > 0) {
      data.sort(function(a, b){
          var keyA = a.id,
              keyB = b.id;
          // Compare the 2 keys
          if(keyA < keyB) return -1;
          if(keyA > keyB) return 1;
          return 0;
      });
      
      return data.map((menu, index) => (
        <React.Fragment key={index}>
          <tr id={`toggle_menu_${index}`} className="menu-toggle" key={menu.id}>
            <th scope="row" data_id={menu.id} data_image_url={menu.image_url}> 
              {index + 1} &nbsp;&nbsp;&nbsp;<span className="table-view-card-id"> {menu.id} </span>  
            </th>
            <th>{menu.name}</th>
            <th restaurant_id={menu.restaurant.id}>{menu.restaurant.name}</th>
            <th>{menu.order}</th>
            <th>
              <Button
                color="warning"
                onClick={e => {
                  e.stopPropagation();
                  e.preventDefault();
                  this.modal_data = menu;
                  this.toggle();
                }}
              >
                <i className="fa fa-edit" />
              </Button>
              <Button
                color="danger"
                onClick={e => {
                  this.handleDelete(menu.id, e);
                }}
              >
                <i className="fa fa-trash" />
              </Button>
            </th>
          </tr>
          <tr>
            <th colSpan={5} style={{ padding: 0 }}>
              <UncontrolledCollapse
                toggler={`toggle_menu_${index}`}
                className="p-3"
              >
                <Button
                  color="default"
                  onClick={() => {
                    this.addMenuItemInput(menu.id);
                  }}
                >
                  <i className="fa fa-plus"> Item</i>
                </Button>
                <Button
                  color="primary"
                  onClick={e => this.handleMenuItemSubmit(menu.id, e)}
                >
                  <i className="fa fa-check"> Submit</i>
                </Button>
                <input
                  type="file"
                  style={{ display: 'none' }}
                  onChange={this.onChangeCSVFile}
                  onClick={(e) => e.target.value = null}
                  ref={ref => {
                    this.csvUploader = ref;
                  }}
                />
                <Button color="default" onClick={()=>{this.onClickAddItemFromExcel(menu.id);}}>
                  &nbsp;Add from CSV
                </Button>
                <Button 
                  color="default" 
                  onClick={()=>{
                    this.onExportCSV(menu.id);
                  }}
                >
                  &nbsp;Export csv
                </Button>
                {this.renderSubmitItems(menu)}
                <div className="w-100 border-bottom" />
                {menu.items.map(item => this.renderMenuItems(item))}
              </UncontrolledCollapse>
            </th>
          </tr>
        </React.Fragment>
      ));
    }
  }

  render() {
    const { loading, message } = this.props;

    if (loading) {
      Swal({
        title: 'Please wait...',
        text: message,
        onOpen: () => {
          Swal.showLoading();
        },
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false
      });
    } else {
      Swal.close();
    }

    if (this.props.data && this.props.data.length > 0) {
      return (
        <React.Fragment>
          <Table striped bordered responsive>
            <thead>
              <tr>
                <th># &nbsp;&nbsp;&nbsp;<span className="table-view-card-id"> (id) </span> </th>
                <th>Name</th>
                <th>Restaurant</th>
                <th>Order</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>{this.renderMenuTable()}</tbody>
          </Table>
          <MenuEditModal
            modal={this.state.modal}
            menu={this.modal_data}
            toggle={this.toggle}
            restaurants={
              this.props.restaurant.restaurants
                ? this.props.restaurant.restaurants.data
                : []
            }
          />
        </React.Fragment>
      );
    } else {
      return <div />;
    }
  }
}

export default connect(
  state => ({
    ...state.default.services.item,
    restaurant: state.default.services.restaurant
  }),
  dispatch => ({
    itemActions: bindActionCreators(
      { addItem, deleteItem, addItems, updateItem, addItems1 },
      dispatch
    ),
    menuActions: bindActionCreators({ deleteMenu }, dispatch),
    restaurantActions: bindActionCreators({ getRestaurants }, dispatch)
  })
)(withRouter(MenuTable));
