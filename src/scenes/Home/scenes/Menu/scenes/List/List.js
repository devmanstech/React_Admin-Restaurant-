import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { toastr } from 'react-redux-toastr';
import Swal from 'sweetalert2';
import CSVParse from 'csv-parse';
import moment from 'moment';
import $ from 'jquery';
import settings from 'config/settings.js';
import {
  Button,
  FormGroup,
  Label,
  Input,
  UncontrolledCollapse
} from 'reactstrap';

// Import Components
import MenuTable from './components/MenuTable';
import { Pagination } from 'components';

// Import Actions
import { getMenus, addMenus, addMenusItems } from 'services/menu/menuActions';
import { showModal } from 'modals/modalConductorActions';

// Import Utility functions
import { errorMsg, updateSearchQueryInUrl } from 'services/utils';
import queryString from 'query-string';

class List extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      activePage: 1,
      restaurant_id: 0,
      menu_id_max: 100000
    };

    this.renderMenus = this.renderMenus.bind(this);
    this.onAddClick = this.onAddClick.bind(this);
    this.onPaginationSelect = this.onPaginationSelect.bind(this);
    this.renderPagination = this.renderPagination.bind(this);
    this.onFilterChange = this.onFilterChange.bind(this);
    this.handleSearchClick = this.handleSearchClick.bind(this);
    this.onClickAddMenuFromExcel = this.onClickAddMenuFromExcel.bind(this);
    this.onChangeCSVFile = this.onChangeCSVFile.bind(this);
    this.onChangeCSVFile_all = this.onChangeCSVFile_all.bind(this);
    this.onExportCSV = this.onExportCSV.bind(this);
    this.onClickAddMenuFromExcel_all = this.onClickAddMenuFromExcel_all.bind(this);
    this.onExportCSV_all = this.onExportCSV_all.bind(this);
    this.onQRCodeClick = this.onQRCodeClick.bind(this);
  }

  componentWillMount() {
    // Dispatch GET_CITIES action to generate cities list
    const params = queryString.parse(this.props.location.search);
    if (params.page) {
      this.setState({
        activePage: params.page
      });
    }

    this.props.menuActions.getMenus(params);

    // set restaurant_id
    const search = this.props.location.search;
    if(search != ''){
      this.setState ({
        restaurant_id: search.split("=")[1]
      });
    }

    var self = this;
    // get max menu id
    $.post(settings.BASE_URL + '/api/menus/max_menu_id', function(msg) {
        self.setState({
          menu_id_max: msg
        })
    });
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
      this.props.menuActions.getMenus(params);
    }

    // set restaurant_id
    const search = this.props.location.search;
    var id = 0;
    if(search != '' && search.indexOf('restaurant=') >= 0){
      id = parseInt(search.split("=")[1]);
    }
    if(id != this.state.restaurant_id){
      this.setState ({
        restaurant_id: id
      });
    }
  }

  onFilterChange(e) {
    this.filter = {
      ...this.filter,
      [e.target.name]: e.target.value
    };
  }

  onAddClick() {
    this.props.modalActions.showModal('MENU_ADD_MODAL');
  }

  onQRCodeClick() {
    this.props.modalActions.showModal('QRCODE', this.state.restaurant_id);
  }

  handleSearchClick() {
    updateSearchQueryInUrl(this);
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

  onClickAddMenuFromExcel() {
    this.csvUploader.click();
  }

  onClickAddMenuFromExcel_all() {
    this.csvUploader_all.click();
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
            if(record[5] !== ''){
              item['created_at'] = moment().format('YYYY-MM-DD HH:mm:ss');
              item['updated_at'] = moment().format('YYYY-MM-DD HH:mm:ss');
              item['id'] = record[0];
              item['name'] = record[1];
              item['restaurant_id'] = record[2];
              item['order'] = record[3];
              item['image_url'] = record[4];
              item['action'] = record[5];
              output.push(item);
            }
          }
        })
        .on('end', () => {
          if(output[0]['id'] != "Menu_Id"){
            toastr.warning('Warning', "Please select file for Menu data");
            return;
          } 
          output.splice(0, 1);
          console.log(output);
          if(output.length === 0){
            toastr.warning('Warning', "No operations in file");
            return;
          } else{
            this.props.menuActions.addMenus(output, params);
          }
        });
    };
    fileReader.readAsText(file, "UTF-8");
  }

  onChangeCSVFile_all(event) {
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
              item['order'] = record[2];
              item['image_url'] = record[3];
              if(record[4] !== '#') {
                item['price'] = parseFloat(record[4]) * settings.INTEGER_PRECISION;
              } else {
                item['price'] = '#';
              }
              item['parent_id'] = record[5];
              item['action'] = record[6];
              output.push(item);
            }
          }
        })
        .on('end', () => {
          if(output[0]['id'] != 'Menus_Items'){
            toastr.warning('Warning', "Please select file for menus and items");
            return;
          } 
          output.splice(0, 1);
          output.splice(0, 1);
          if(output.length === 0){
            toastr.warning('Warning', "No operations in file");
            return;
          } else{
            this.props.menuActions.addMenusItems(output, params);
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
      var rows = document.querySelectorAll("table tr.menu-toggle");
      var header = ['Menu_Id', 'Name', 'Restaurant_Id', 'Order', 'Image Url', 'Act(i/u/d)'];
      csv.push(header.join(","));
      for (var i = 0; i < rows.length; i++) {
          var row = [], cols = rows[i].querySelectorAll("td, th");
          row.push(cols[0].attributes[1].value); // Menu_Id
          row.push(cols[1].innerText); // Name
          row.push(cols[2].attributes[0].value); // Restaurant_Id
          row.push(cols[3].innerText); // Order
          if(cols[0].attributes[2] !== undefined){
            row.push(cols[0].attributes[2].value); // Image Url 
          } else{
            row.push("");
          }
          row.push("");
          csv.push(row.join(","));
      }
      // Download CSV file
      this.downloadCSV(csv.join("\n"), filename);
  }

  onExportCSV(){
    let self = this;
    setTimeout(function(){
      self.exportTableToCSV("Menu.csv");
    }, 500);
  }

  exportTableToCSV_all(filename) {
    var csv = [];
    csv.push(['Menus_Items', 'Restaurant_Id =',  this.state.restaurant_id.toString(), '#####', 'menu id >=', parseInt(this.state.menu_id_max) + 1, '#####']);
    var rows_menu = document.querySelectorAll("table tr.menu-toggle");
    var all_trs = document.querySelectorAll("table tr");
    var header = ['-- Id --', '-- Name --', '-- Order --', '--- Image Url ---', '-- Price --', '-- Parent_Id --', '-- Act(i/u/d) --'];
    csv.push(header.join(","));
    for (var i = 0; i < rows_menu.length; i++) {
        // a menu
        var row = [], cols = rows_menu[i].querySelectorAll('td, th');
        var menu_id = cols[0].attributes[1].value;
        row.push(menu_id + '-menu'); // Menu_Id
        row.push(cols[1].innerText); // Name
        row.push(cols[3].innerText); // Order
        if(cols[0].attributes[2] !== undefined){
          row.push(cols[0].attributes[2].value); // Image Url 
        } else{
          row.push('');
        }
        row.push('#'); // Price
        row.push(this.state.restaurant_id); // parent_id
        row.push(''); // Act
        csv.push(row.join(','));

        // items of a menu
        var rows_item = all_trs[(i+1)*2].querySelectorAll('th div .border-bottom .row');
        for (var j = 0; j < rows_item.length; j+=2) {
           var row_a = [], cols_a = rows_item[j].querySelectorAll('.item');
           row_a.push(cols_a[0].attributes[1].value); // Item_Id
           row_a.push(cols_a[0].innerText); // Name
           row_a.push(cols_a[0].attributes[2].value); // Order
           if(cols_a[0].attributes[3] !== undefined){
             row_a.push(cols_a[0].attributes[3].value); // Image Url
           } else{
             row_a.push('');
           }
           row_a.push(cols_a[1].innerText); // Price
           row_a.push(menu_id); // parent_id
           row_a.push(''); // Act
           csv.push(row_a.join(','));
        }
    }
    // Download CSV file
    this.downloadCSV(csv.join("\n"), filename);
  }

  onExportCSV_all(){
    let self = this;
    setTimeout(function(){
      self.exportTableToCSV_all("Menus_Items.csv");
    }, 500);
  }

  renderMenus() {
    if (this.props.menus) {
      const { data } = this.props.menus;

      if (data && data.length > 0) {
        return (
          <MenuTable
            data={data}
            from={this.props.menus.meta ? this.props.menus.meta.from : ''}
          />
        );
      } else {
        return <div>No Menu data to list</div>;
      }
    }
  }

  renderPagination() {
    if (
      this.props.menus &&
      this.props.menus.meta &&
      this.props.menus.data &&
      this.props.menus.data.length > 0
    ) {
      return (
        <Pagination
          totalItems={this.props.menus.meta.total}
          pageSize={parseInt(this.props.menus.meta.per_page)}
          onSelect={this.onPaginationSelect}
          activePage={parseInt(this.state.activePage)}
        />
      );
    }
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
        <h1 className="text-center mb-5">Menus</h1>
        <div className="mb-3">
        {this.state.restaurant_id === 0 ? (
          <div>
            {/* Action button */}
            <Button color="default" onClick={this.onAddClick}>
              <i className="fa fa-plus" />
              &nbsp;Add menu
            </Button>
            <Button id="toggle_menu" color="warning">
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
            <Button color="default" onClick={this.onClickAddMenuFromExcel}>
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
          </div>
          ) : (
            <div>
              {/* Action button */}
              <Button color="default" onClick={this.onAddClick}>
                <i className="fa fa-plus" />
                &nbsp;Add menu
              </Button>
              <Button id="toggle_menu" color="warning">
                Open filter&nbsp;
                <i className="fa fa-filter" />
              </Button>
              <input
                type="file"
                style={{ display: 'none' }}
                onChange={this.onChangeCSVFile_all}
                ref={ref => {
                  this.csvUploader_all = ref;
                }}
              />
              <Button color="default" onClick={this.onClickAddMenuFromExcel_all}>
                &nbsp;Import all of a restaurant
              </Button>
              <Button 
                color="default" 
                onClick={this.onExportCSV_all}
              >
                &nbsp;Export all of a restaurant
              </Button>
              <Button
                color="default"
                onClick={this.onQRCodeClick}
              >
                &nbsp;QR Code
              </Button>
            </div>
          )}
        </div>
        {/* Filter Box*/}
        <UncontrolledCollapse
          toggler="#toggle_menu"
          className="col-md-8 col-sm-12 mt-5 mb-5"
        >
          <FormGroup>
            <Label>Menu</Label>
            <Input
              type="text"
              name="menu_name"
              onChange={this.onFilterChange}
            />
          </FormGroup>
          <Button onClick={this.handleSearchClick}>
            <i className="fa fa-search" />
            Search
          </Button>
        </UncontrolledCollapse>
        <div className="d-flex flex-column">
          {/* Render menu table */}
          {this.renderMenus()}
          {/* Render pagination */}
          {this.renderPagination()}
        </div>
      </div>
    );
  }
}

export default connect(
  state => ({
    ...state.default.services.menu
  }),
  dispatch => ({
    menuActions: bindActionCreators({ getMenus, addMenus, addMenusItems }, dispatch),
    modalActions: bindActionCreators({ showModal }, dispatch)
  })
)(List);
