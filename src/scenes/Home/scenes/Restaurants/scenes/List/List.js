import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { toastr } from 'react-redux-toastr';
import Swal from 'sweetalert2';
import CSVParse from 'csv-parse';
import moment from 'moment';

import {
  Button,
  FormGroup,
  Label,
  Input,
  UncontrolledCollapse,
  Card,
  CardImg,
  CardTitle,
  CardText,
  CardImgOverlay,
  Table
} from 'reactstrap';

// Import Components
import { Pagination } from 'components';

// Import actions
import {
  addRestaurants,
  getRestaurants,
  deleteRestaurant
} from 'services/restaurant/restaurantActions';
import { showModal } from 'modals/modalConductorActions';

// Import utility functions
import { errorMsg, updateSearchQueryInUrl } from 'services/utils';
import queryString from 'query-string';

// Import settings
import settings from 'config/settings';

const VIEW_MODE_TILE = 'VIEW_MODE_TILE';
const VIEW_MODE_TABLE = 'VIEW_MODE_TABLE';

class List extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      activePage: 1,
      viewMode: VIEW_MODE_TILE
    };

    this.renderRestaurantsTable = this.renderRestaurantsTable.bind(this);
    this.renderPagination = this.renderPagination.bind(this);
    this.renderFilter = this.renderFilter.bind(this);
    this.onAddClick = this.onAddClick.bind(this);
    this.onPaginationSelect = this.onPaginationSelect.bind(this);
    this.onFilterChange = this.onFilterChange.bind(this);
    this.onSearchClick = this.onSearchClick.bind(this);
    this.onViewModeChange = this.onViewModeChange.bind(this);
    this.onEdit = this.onEdit.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.onQRCode = this.onQRCode.bind(this);
    this.onClickAddRestaurantFromExcel = this.onClickAddRestaurantFromExcel.bind(this);
    this.onChangeCSVFile = this.onChangeCSVFile.bind(this);
    this.onExportCSV = this.onExportCSV.bind(this);
  }

  componentDidMount() {
    // Parse query string and send async api call
    const params = queryString.parse(this.props.location.search);
    if (params.page) {
      this.setState({
        activePage: params.page
      });
    }
    this.props.restaurantActions.getRestaurants(params);
  }

  componentDidUpdate(prevProps) {
    if (this.props.error !== prevProps.error && this.props.error !== null) {
      let msg = errorMsg(this.props.error);
      toastr.error(msg.title, msg.message);
    }

    if (
      this.props.success !== prevProps.success &&
      this.props.success === true
    ) {
      toastr.success('Success', this.props.message);
    }

    // If query param is changed
    if (prevProps.location.search !== this.props.location.search) {
      const params = queryString.parse(this.props.location.search);
      if (params.page) {
        this.setState({
          activePage: params.page
        });
      }
      this.props.restaurantActions.getRestaurants(params);
    }
  }

  onFilterChange(e) {
    this.filter = {
      ...this.filter,
      [e.target.name]: e.target.value
    };
  }

  onAddClick() {
    this.props.modalActions.showModal('RESTAURANT_ADD_MODAL');
  }

  onSearchClick() {
    updateSearchQueryInUrl(this);
  }

  onViewModeChange(viewMode) {
    this.setState({
      viewMode
    });
  }

  onEdit(restaurant, e) {
    e.stopPropagation();
    this.props.modalActions.showModal('RESTAURANT_EDIT_MODAL', restaurant);
    // this.props.history.push(`/restaurants/${id}/edit`);
  }

  onDelete(id, e) {
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
        this.props.restaurantActions.deleteRestaurant(id);
      }
    });
  }

  onQRCode(id, e){
    e.stopPropagation();
    this.props.modalActions.showModal('QRCODE', id);
  }

  onPaginationSelect(selectedPage) {
    let values = queryString.parse(this.props.location.search);
    values = {
      ...values,
      page: selectedPage
    };

    const searchQuery = queryString.stringify(values);
    this.props.history.push({
      pathname: this.props.location.pathname,
      search: `?${searchQuery}`
    });
  }

  onClickAddRestaurantFromExcel() {
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
            if(record[6] !== ''){
              item['created_at'] = moment().format('YYYY-MM-DD HH:mm:ss');
              item['updated_at'] = moment().format('YYYY-MM-DD HH:mm:ss');
              item['id'] = record[0];
              item['name'] = record[1];
              if(record[2] === ''){
                item['category'] = [];
              } else{
                item['category'] = record[2].split(';');
              }
              item['order'] = record[3];
              item['image_url'] = record[4];
              item['is_open'] = record[5];
              item['action'] = record[6];
              output.push(item);
              console.log(item);
            }
          }
        })
        .on('end', () => {
          if(output[0]['id'] != "Restaurant_Id"){
            toastr.warning('Warning', "Please select file for Restaurant data");
            return;
          } 
          output.splice(0, 1);
          console.log(output);
          if(output.length === 0){
            toastr.warning('Warning', "No operations in file");
            return;
          } else{
            this.props.restaurantActions.addRestaurants(output, params);
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

  exportTableToCSV(filename) {
      var csv = [];
      var rows = document.querySelectorAll("table tr");
      for (var i = 0; i < rows.length; i++) {
          var row = [], cols = rows[i].querySelectorAll("td, th");
          if(i === 0){
            row = ['Restaurant_Id', 'Name', 'CategoryIds', 'Order', 'Image Url', 'Opened/Closed', 'Act(i/u/d)'];
          } else{
            row.push(cols[0].attributes[1].value); // Restaurant_Id
            row.push(cols[1].innerText); // Name
            row.push(cols[2].attributes[0].value); // CategoryIds
            row.push(cols[4].innerHTML); // Orders
            if(cols[0].attributes[2]){
              row.push(cols[0].attributes[2].value); // Image Url
            } else{
              row.push("");
            }
            if(cols[3].innerText === 'Opened'){
              row.push('1'); // Opened
            } else{
              row.push('0'); // Closed
            }
            row.push("");
          }
          csv.push(row.join(","));
      }
      // Download CSV file
      this.downloadCSV(csv.join("\n"), filename);
  }

  onExportCSV(){
    this.setState({viewMode: VIEW_MODE_TABLE});
    let self = this;
    setTimeout(function(){
      self.exportTableToCSV("Restaurant.csv");
    }, 500);
  }

  renderRestaurantsTable() {
    if (this.props.restaurants) {
      const { data } = this.props.restaurants;
      console.log(data);
      if (data && data.length > 0) {
        const restaurantTableRows = data.map((restaurant, index) => {
          let categoryNameArray = [];
          let categoryIdArray = [];
          if (restaurant.categories) {
            categoryNameArray = restaurant.categories.map(item => {
              return item.name;
            });
            categoryIdArray = restaurant.categories.map(item => {
              return item.id;
            });
          }

          const categories = categoryNameArray.join(', ');
          const categoryIds = categoryIdArray.join(';');

          return (
            <tr key={restaurant.id}>
              <th scope="row" data_id={restaurant.id} data_image_url={restaurant.image_url}> {index + 1} </th>
              <th>
                {/* eslint-disable-next-line  */}
                <a
                  href="#"
                  onClick={() => {
                    window.location.href = `/menus?restaurant=${restaurant.id}`;
                  }}
                >
                  {restaurant.name}
                </a>
              </th>
              <th data_category_ids={categoryIds}>{categories} </th>
              <th>{restaurant.is_open ? 'Opened' : 'Closed'}</th>
              <th>{restaurant.order}</th>
              <th>
                <Button
                  color="warning"
                  onClick={e => {
                    this.onEdit(restaurant, e);
                  }}
                >
                  <i className="fa fa-edit" />
                </Button>
                <Button
                  color="danger"
                  onClick={e => {
                    this.onDelete(restaurant.id, e);
                  }}
                >
                  <i className="fa fa-trash" />
                </Button>
                <Button
                  color="primary"
                  onClick={e => {
                    this.onQRCode(restaurant.id, e);
                  }}
                >
                  <i className="fa fa-qrcode" />
                </Button>
              </th>
            </tr>
          );
        });

        return (
          <Table striped bordered responsive>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Categories</th>
                <th>Open/Closed</th>
                <th>Order</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>{restaurantTableRows}</tbody>
          </Table>
        );
      } else {
        return <div>No restaurant data to list</div>;
      }
    }
  }

  renderRestaurantsTile() {
    if (this.props.restaurants) {
      const { data } = this.props.restaurants;

      if (data && data.length > 0) {
        return data.map((restaurant, index) => {
          let closedSz = '';
          if (!restaurant.is_open) {
            closedSz = '(Closed)';
          }

          return (
            <div
              key={index}
              className="col-lg-3 col-md-6 col-xs-12 mb-3 d-flex align-items-stretch"
              onClick={() => {
                //this.props.history.push(`/menus?restaurant=${restaurant.id}`);
                window.location.href = `/menus?restaurant=${restaurant.id}`;
              }}
            >
              <Card className="text-center w-100">
                <CardImg
                  top
                  width="100%"
                  height="280px"
                  className=""
                  src={settings.BASE_URL + restaurant.image_url}
                  alt={restaurant.name}
                />
                <div className="normal-tile-overlay" />
                <CardImgOverlay>
                  <CardTitle className="tile-view-card-title">
                    {restaurant.name + closedSz}
                  </CardTitle>
                  <CardText className="tile-view-card-id"> 
                    {restaurant.id} 
                  </CardText>
                  <div className="card-buttons-hover-show">
                    <Button
                      size="sm"
                      color="warning"
                      onClick={e => {
                        this.onEdit(restaurant, e);
                      }}
                    >
                      <i className="fa fa-edit" />
                    </Button>
                    <Button
                      size="sm"
                      color="danger"
                      onClick={e => {
                        this.onDelete(restaurant.id, e);
                      }}
                    >
                      <i className="fa fa-trash" />
                    </Button>
                    <Button
                      size="sm"
                      color="primary"
                      onClick={e => {
                        this.onQRCode(restaurant.id, e);
                      }}
                    >
                      <i className="fa fa-qrcode" />
                    </Button>
                  </div>
                </CardImgOverlay>
              </Card>
            </div>
          );
        });
      } else {
        return <div>No restaurant data to list</div>;
      }
    }
  }

  renderPagination() {
    if (
      this.props.restaurants &&
      this.props.restaurants.meta &&
      this.props.restaurants.data &&
      this.props.restaurants.data.length > 0
    ) {
      return (
        <Pagination
          totalItems={this.props.restaurants.meta.total}
          pageSize={parseInt(this.props.restaurants.meta.per_page)}
          onSelect={this.onPaginationSelect}
          activePage={parseInt(this.state.activePage)}
        />
      );
    }
  }

  renderFilter() {
    return (
      <div>
        {/* Action button */}
        <Button color="default" onClick={this.onAddClick}>
          <i className="fa fa-plus" />
          &nbsp;Add restaurant
        </Button>
        <Button id="toggle_restaurant" color="warning">
          Open filter&nbsp;
          <i className="fa fa-filter" />
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
        <Button color="default" onClick={this.onClickAddRestaurantFromExcel}>
          <i className="fa fa-file-excel-o" />
          &nbsp;Add from CSV
        </Button>
        <Button 
          color="default" 
          onClick={this.onExportCSV}
        >
          <i className="fa fa-file-excel-o" />
          &nbsp;Export csv
        </Button>
        &nbsp;&nbsp;&nbsp;&nbsp;
        <Button onClick={() => this.onViewModeChange(VIEW_MODE_TILE)}>
          <i className="fa fa-th" />
        </Button>
        <Button onClick={() => this.onViewModeChange(VIEW_MODE_TABLE)}>
          <i className="fa fa-th-list" />
        </Button>
        <UncontrolledCollapse
          toggler="#toggle_restaurant"
          className="col-md-8 col-sm-12 mt-5 mb-5"
        >
          <FormGroup>
            <Label>Restaurant</Label>
            <Input
              type="text"
              name="restaurant_name"
              onChange={this.onFilterChange}
            />
          </FormGroup>
          <Button onClick={this.onSearchClick}>
            <i className="fa fa-search" />
            Search
          </Button>
        </UncontrolledCollapse>
      </div>
    );
  }

  render() {
    const { loading, message } = this.props;

    // if loading status show sweet alert
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

    return (
      <div>
        <h1 className="text-center mb-5">Restaurants</h1>
        <div className="mb-3">{this.renderFilter()}</div>
        <div className="d-flex flex-column">
          {/* Render restaurants table */}
          {this.state.viewMode === VIEW_MODE_TABLE ? (
            this.renderRestaurantsTable()
          ) : (
            <div className="row">{this.renderRestaurantsTile()}</div>
          )}

          {/* Render pagination */}
          {this.renderPagination()}
        </div>
      </div>
    );
  }
}

export default connect(
  state => ({
    ...state.default.services.restaurant
  }),
  dispatch => ({
    restaurantActions: bindActionCreators(
      {
        addRestaurants,
        getRestaurants,
        deleteRestaurant
      },
      dispatch
    ),
    modalActions: bindActionCreators({ showModal }, dispatch)
  })
)(List);
