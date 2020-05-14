import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { toastr } from 'react-redux-toastr';
import Swal from 'sweetalert2';
import queryString from 'query-string';
import { Link } from 'react-router-dom';
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
  Table,
  CardSubtitle
} from 'reactstrap';

// Import Components
import { Pagination } from 'components';

// Import actions
import {
  getCategories,
  addCategories,
  deleteCategory
} from 'services/category/categoryActions';
import { showModal } from 'modals/modalConductorActions';

// Import Utility functions
import { errorMsg, updateSearchQueryInUrl } from 'services/utils';

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

    this.filter = {};

    this.renderCategoriesTable = this.renderCategoriesTable.bind(this);
    this.renderPagination = this.renderPagination.bind(this);
    this.renderFilter = this.renderFilter.bind(this);

    this.onAddClick = this.onAddClick.bind(this);
    this.onPaginationSelect = this.handleSelected.bind(this);
    this.onFilterChange = this.onFilterChange.bind(this);
    this.onSearchClick = this.onSearchClick.bind(this);
    this.onViewModeChange = this.handleViewModeChange.bind(this);
    this.onEdit = this.onEdit.bind(this);
    this.onDelete = this.handleDelete.bind(this);
    this.onClickAddCategoryFromExcel = this.onClickAddCategoryFromExcel.bind(this);
    this.onChangeCSVFile = this.onChangeCSVFile.bind(this);
    this.onExportCityCSV = this.onExportCityCSV.bind(this);
  }

  componentDidMount() {
    // Parse query string and send async api call
    const params = queryString.parse(this.props.location.search);
    if (params.page) {
      this.setState({
        activePage: params.page
      });
    }
    this.props.categoryActions.getCategories(params);
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
      this.props.categoryActions.getCategories(params);
    }
  }

  onFilterChange(e) {
    this.filter = {
      ...this.filter,
      [e.target.name]: e.target.value
    };
  }

  onAddClick() {
    this.props.modalActions.showModal('ADD_CATEGORY_MODAL');
  }

  onSearchClick() {
    updateSearchQueryInUrl(this);
  }

  handleViewModeChange(viewMode) {
    this.setState({
      viewMode
    });
  }

  handleSelected(selectedPage) {
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

  /// Handle edit button click event
  onEdit(category, e) {
    e.stopPropagation();
    this.props.modalActions.showModal('EDIT_CATEGORY_MODAL', category);
  }

  /// Handle delete button click event
  handleDelete(id, e) {
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
        this.props.categoryActions.deleteCategory(id);
      }
    });
  }

  onClickAddCategoryFromExcel() {
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
              item['city_id'] = record[2];
              item['order'] = record[3];
              item['image_url'] = record[4];
              item['is_open'] = record[5];
              item['action'] = record[6];
              output.push(item);
            }
          }
        })
        .on('end', () => {
          if(output[0]['id'] != "Category_Id"){
            toastr.warning('Warning', "Please select file for Category data");
            return;
          }          
          output.splice(0, 1);
          console.log(output);
          if(output.length === 0){
            toastr.warning('Warning', "No operations in file");
            return;
          } else{
            this.props.categoryActions.addCategories(output, params);
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
            row = ['Category_Id', 'Name', 'City_Id', 'Order', 'Image Url', 'Opened/Closed', 'Act(i/u/d)'];
          } else{
            row.push(cols[0].attributes[1].value); // Category_Id
            row.push(cols[1].innerText); // Category Name
            row.push(cols[2].attributes[0].value); // City_Id
            row.push(cols[4].innerText); // Order
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

  onExportCityCSV(){
    this.setState({viewMode: VIEW_MODE_TABLE});
    let self = this;
    setTimeout(function(){
      self.exportTableToCSV("Category.csv");
    }, 500);
  }

  renderCategoriesTable() {
    if (this.props.categories) {
      const { data } = this.props.categories;

      if (data && data.length > 0) {
        const categoryTableRows = data.map((category, index) => (
          <tr key={category.id}>
            <th scope="row" data_id={category.id} data_image={category.image_url}> {index + 1} </th>
            <th>
              <Link
                to={{
                  pathname: '/restaurants',
                  search: `?category=${category.id}`
                }}
              >
                {category.name}
              </Link>
            </th>
            <th data_city_id={category.city.id}>{category.city.name}</th>
            <th>{category.is_open ? 'Opened' : 'Closed'}</th>
            <th>{category.order}</th>
            <th>
              <Button
                color="warning"
                onClick={e => {
                  this.onEdit(category, e);
                }}
              >
                <i className="fa fa-edit" />
              </Button>
              <Button
                color="danger"
                onClick={e => {
                  this.onDelete(category.id, e);
                }}
              >
                <i className="fa fa-trash" />
              </Button>
            </th>
          </tr>
        ));
        return (
          <Table striped bordered responsive>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>City</th>
                <th>Open/Closed</th>
                <th>Order</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>{categoryTableRows}</tbody>
          </Table>
        );
      } else {
        return <div>No Categories Data to list</div>;
      }
    }
  }

  renderCategoriesTile() {
    if (this.props.categories) {
      const { data } = this.props.categories;

      if (data && data.length > 0) {
        return data.map((category, index) => {
          let closedSz = '';
          if (!category.is_open) {
            closedSz = '(Closed)';
          }

          return (
            <div
              key={index}
              className="col-lg-3 col-md-6 col-xs-12 mb-3 d-flex align-items-stretch"
              onClick={() => {
                this.props.history.push(`/restaurants?category=${category.id}`);
              }}
            >
              <Card className="text-center w-100">
                <CardImg
                  top
                  width="100%"
                  height="280px"
                  className=""
                  src={settings.BASE_URL + category.image_url}
                  alt={category.name}
                />
                <div className="normal-tile-overlay" />
                <CardImgOverlay>
                  <CardTitle className="tile-view-card-title">
                    {category.name + closedSz}
                  </CardTitle>
                  <CardSubtitle className="text-white">
                    {category.city ? category.city.name : 'N/A'}
                  </CardSubtitle>
                  <CardText className="tile-view-card-id"> 
                    {category.id} 
                  </CardText>
                  <div className="card-buttons-hover-show">
                    <Button
                      size="sm"
                      color="warning"
                      onClick={e => {
                        this.onEdit(category, e);
                      }}
                    >
                      <i className="fa fa-edit" />
                    </Button>
                    <Button
                      size="sm"
                      color="danger"
                      onClick={e => {
                        this.handleDelete(category.id, e);
                      }}
                    >
                      <i className="fa fa-trash" />
                    </Button>
                  </div>
                </CardImgOverlay>
              </Card>
            </div>
          );
        });
      } else {
        return <div>No Categories Data to list</div>;
      }
    }
  }

  renderPagination() {
    if (
      this.props.categories &&
      this.props.categories.meta &&
      this.props.categories.data &&
      this.props.categories.data.length > 0
    ) {
      return (
        <Pagination
          totalItems={this.props.categories.meta.total}
          pageSize={parseInt(this.props.categories.meta.per_page)}
          onSelect={this.handleSelected}
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
          &nbsp;Add category
        </Button>
        <Button id="toggle_category" color="warning">
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
        <Button color="default" onClick={this.onClickAddCategoryFromExcel}>
          <i className="fa fa-file-excel-o" />
          &nbsp;Add from CSV
        </Button>
        <Button 
          color="default" 
          onClick={this.onExportCityCSV} 
        >
          <i className="fa fa-file-excel-o" />
          &nbsp;Export csv
        </Button>
        <Button onClick={() => this.handleViewModeChange(VIEW_MODE_TILE)}>
          <i className="fa fa-th" />
        </Button>
        <Button onClick={() => this.handleViewModeChange(VIEW_MODE_TABLE)}>
          <i className="fa fa-th-list" />
        </Button>
        <UncontrolledCollapse
          toggler="#toggle_category"
          className="col-md-8 col-sm-12 mt-5 mb-5"
        >
          <FormGroup>
            <Label>Category name</Label>
            <Input
              type="text"
              name="category_name"
              onChange={this.onFilterChange}
            />
          </FormGroup>
          <FormGroup>
            <Label>City name</Label>
            <Input
              type="text"
              name="city_name"
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
        <h1 className="text-center mb-5">Categories</h1>
        <div className="mb-3">
          {/* Render category filter section */}
          {this.renderFilter()}
        </div>

        {/* Table */}
        <div className="d-flex flex-column">
          {/* Render categories table */}
          {this.state.viewMode === VIEW_MODE_TABLE ? (
            this.renderCategoriesTable()
          ) : (
            <div className="row">{this.renderCategoriesTile()}</div>
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
    ...state.default.services.category
  }),
  dispatch => ({
    categoryActions: bindActionCreators(
      { addCategories, getCategories, deleteCategory },
      dispatch
    ),
    modalActions: bindActionCreators({ showModal }, dispatch)
  })
)(List);
