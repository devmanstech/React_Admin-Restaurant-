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
  UncontrolledCollapse
} from 'reactstrap';

// Import Components
import MenuItemTable from './components/MenuItemTable';
import { Pagination } from 'components';

// Import Actions
import { getItems, addItems1 } from 'services/item/itemActions';
import { showModal } from 'modals/modalConductorActions';

// Import Utility functions
import { errorMsg, updateSearchQueryInUrl } from 'services/utils';
import queryString from 'query-string';
import settings from 'config/settings';

class List extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      activePage: 1
    };

    this.renderItems = this.renderItems.bind(this);
    this.onAddClick = this.onAddClick.bind(this);
    this.onPaginationSelect = this.onPaginationSelect.bind(this);
    this.renderPagination = this.renderPagination.bind(this);
    this.onFilterChange = this.onFilterChange.bind(this);
    this.handleSearchClick = this.handleSearchClick.bind(this);
    this.onClickAddItemFromExcel = this.onClickAddItemFromExcel.bind(this);
    this.onChangeCSVFile = this.onChangeCSVFile.bind(this);
    this.onExportCSV = this.onExportCSV.bind(this);
  }

  componentWillMount() {
    // Parse query string and send async api call
    const params = queryString.parse(this.props.location.search);
    if (params.page) {
      this.setState({
        activePage: params.page
      });
    }
    this.props.itemActions.getItems(params);
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
      this.props.itemActions.getItems(params);
    }
  }

  onFilterChange(e) {
    this.filter = {
      ...this.filter,
      [e.target.name]: e.target.value
    };
  }

  onAddClick() {
    this.props.modalActions.showModal('ITEM_ADD_MODAL');
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

  onClickAddItemFromExcel() {
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
              item['order'] = record[2];
              item['image_url'] = record[3];
              item['menu_id'] = record[4];
              item['price'] = parseFloat(record[5]) * settings.INTEGER_PRECISION;
              item['action'] = record[6];
              output.push(item);
            }
          }
        })
        .on('end', () => {
          if(output[0]['id'] != "Item_Id"){
            toastr.warning('Warning', "Please select file for Item data");
            return;
          } 
          output.splice(0, 1);
          console.log(output);
          if(output.length === 0){
            toastr.warning('Warning', "No operations in file");
            return;
          } else{
            this.props.itemActions.addItems1(output, params);
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
            row = ['Item_Id', 'Name', 'Order', 'Image Url', 'Menu_Id', 'Price', 'Act(i/u/d)'];
          } else{
            row.push(cols[0].attributes[1].value); // Item_Id
            row.push(cols[1].innerText); // Name
            row.push(cols[4].innerText); // Order
            if(cols[0].attributes[2]){
              row.push(cols[0].attributes[2].value); // Image Url
            } else{
              row.push("");
            }
            row.push(cols[3].attributes[0].value); // Menu_Id
            row.push(cols[2].innerText); // Price
            row.push(""); // Operation
          }
          csv.push(row.join(","));
      }
      // Download CSV file
      this.downloadCSV(csv.join("\n"), filename);
  }

  onExportCSV(){
    let self = this;
    setTimeout(function(){
      self.exportTableToCSV("Item.csv");
    }, 500);
  }

  renderItems() {
    if (this.props.items) {
      const { data } = this.props.items;

      if (data && data.length > 0) {
        return (
          <MenuItemTable
            data={data}
            from={this.props.items.meta ? this.props.items.meta.from : ''}
          />
        );
      } else {
        return <div>No Menu data to list</div>;
      }
    }
  }

  renderPagination() {
    if (
      this.props.items &&
      this.props.items.meta &&
      this.props.items.data &&
      this.props.items.data.length > 0
    ) {
      return (
        <Pagination
          totalItems={this.props.items.meta.total}
          pageSize={parseInt(this.props.items.meta.per_page)}
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
        <h1 className="text-center mb-5">Items</h1>
        <div className="mb-3">
          {/* Action button */}
          <Button 
            color="default" 
            onClick={this.onAddClick}
          >
            <i className="fa fa-plus" />
            &nbsp;Add item
          </Button>
          <Button id="toggler" color="warning">
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
          <Button color="default" onClick={this.onClickAddItemFromExcel}>
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
        {/* Filter Box*/}
        <UncontrolledCollapse
          toggler="#toggler"
          className="col-md-8 col-sm-12 mt-5 mb-5"
        >
          <FormGroup>
            <Label>Item</Label>
            <Input
              type="text"
              name="item_name"
              onChange={this.onFilterChange}
            />
          </FormGroup>
          <Button onClick={this.handleSearchClick}>
            <i className="fa fa-search" />
            Search
          </Button>
        </UncontrolledCollapse>
        <div className="d-flex flex-column">
          {/* Render Menu items table*/}
          {this.renderItems()}
          {/* Render pagination */}
          {this.renderPagination()}
        </div>
      </div>
    );
  }
}

export default connect(
  state => ({
    ...state.default.services.item
  }),
  dispatch => ({
    itemActions: bindActionCreators({ getItems, addItems1 }, dispatch),
    modalActions: bindActionCreators({ showModal }, dispatch)
  })
)(List);
