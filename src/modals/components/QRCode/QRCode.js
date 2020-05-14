import React from 'react';
import { Form, FormGroup, Label, Input } from 'reactstrap';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import $ from 'jquery';
import Switch from 'react-toggle-switch';
import settings from 'config/settings.js';
import default_image from '../../../assets/images/logo-gray.jpg';
// Import actions
import { hideModal } from '../../modalConductorActions';
import { timeout } from 'q';

class QRCode extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
       is_open: 1,
       restaurant_id : this.props.modal.params,
       info: ""
    };
    this.hideModal = this.hideModal.bind(this);
    this.onGenerate = this.onGenerate.bind(this);
    this.onDownload = this.onDownload.bind(this);
    this.onStateChange = this.onStateChange.bind(this);
    this.onCancel = this.onCancel.bind(this);
  }

  componentDidMount() {
    var self = this;
    $.post(settings.BASE_URL + '/api/qrcode', { restaurant_id: this.state.restaurant_id },  function(result) {
        result = JSON.parse(result).data;
        if(result.length > 0){
            $("#qrcode_image").attr('src', settings.BASE_URL + '/' + result[0].image_url);
            self.setState({
                is_open: result[0].status
            })
        }
    });
  }

  hideModal() {
    this.props.modalActions.hideModal();
  }

  onChangeInfo(e) {
      this.setState({
          info: e.target.value
      })
  }

  onStateChange() {
    this.setState({ is_open: ~~!this.state.is_open });
    $.post(settings.BASE_URL + '/api/set_qrcode_status', { restaurant_id: this.state.restaurant_id, status: ~~!this.state.is_open },  function(result) {
        console.log(result);
    });
  }

  onGenerate() {
    $.post(settings.BASE_URL + '/api/qrcode_generate', { restaurant_id: this.state.restaurant_id, info: this.state.info },  function(result) {
        var path = result;
        $("#qrcode_image").attr('src', settings.BASE_URL + '/' + path);
    });
  }

  onDownload() {
    window.open(settings.BASE_URL + '/api/qrcode_download?restaurant_id=' + this.state.restaurant_id);
  }

  onCancel() {
    this.hideModal();
  }

  render() {
    return (
        <Modal
            isOpen={true}
            toggle={this.hideModal}
            className="modal-dialog-centered"
        >
        <ModalHeader> QRCode </ModalHeader>

        <ModalBody>
            <Form>
                <FormGroup>
                    <Input
                        type="text"
                        name="info"
                        id="info"
                        placeholder="Type simple information"
                        value = {this.state.info}
                        onChange={(e)=>this.onChangeInfo(e)}
                    />
                </FormGroup>
                <FormGroup className="text-center">
                    <img src={default_image} width="300" height="300" id="qrcode_image" />
                </FormGroup>
                <a href="http://localhost:8000/storage/qrcode/1_1559358180.png" download/>
            </Form>
        </ModalBody>

        <ModalFooter>
          <Switch
            id="is_open"
            onClick={this.onStateChange}
            on={!!this.state.is_open}
            />
          <Button color="primary" onClick={this.onGenerate}>
            Generate
          </Button>
          <Button color="primary" onClick={this.onDownload}>
            Download
          </Button>
          <Button color="default" onClick={this.onCancel}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    );
  }
}

export default connect(
    null,
    dispatch => ({
        modalActions: bindActionCreators({ hideModal }, dispatch)
    })
)(QRCode);
