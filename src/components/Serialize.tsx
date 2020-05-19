import * as React from "react";
import {Type, toHexString} from "@chainsafe/ssz";
import Output from "./Output";
import Input from "./Input";
import {PresetName} from "../util/types";
import {inputTypes} from "../util/input_types";
import TreeView from "./TreeView";
import worker from "workerize-loader!./worker";
import LoadingOverlay from "react-loading-overlay";
import BounceLoader from "react-spinners/BounceLoader";

type Props = {
  serializeModeOn: boolean;
};

type State<T> = {
  presetName: PresetName | undefined;
  name: string | undefined;
  input: any;
  sszType: Type<T> | undefined;
  error: string | undefined;
  serialized: Uint8Array | undefined;
  hashTreeRoot: Uint8Array | undefined;
  deserialized: Type<T>;
  showOverlay: boolean;
  overlayText: string;
};

const workerInstance = worker();

export default class Serialize<T> extends React.Component<Props, State<T>> {

  constructor(props: Props) {
    super(props);
    this.state = {
      presetName: undefined,
      name: undefined,
      input: undefined,
      sszType: undefined,
      error: undefined,
      serialized: undefined,
      hashTreeRoot: undefined,
      showOverlay: false,
      overlayText: "",
    };
  }

  setOverlay(showOverlay: boolean, overlayText = "") {
    this.setState({
      showOverlay,
      overlayText,
    });
  }

  process<T>(presetName: PresetName, name: string, input: T, type: Type<T>, inputType: string): void {

    let error;
    this.setOverlay(true, "Serializing...");
    workerInstance.serialize({sszTypeName: name, presetName: presetName, input})
      .then((result: { root: Uint8Array | undefined; serialized: Uint8Array | undefined }) => {
        this.setState({hashTreeRoot: result.root, serialized: result.serialized});
        this.setOverlay(false);
      })
      .catch((e: { message: string }) => error = e.message);

    // note that all bottom nodes are converted to strings, so that they do not have to be formatted,
    // and can be passed through React component properties.

    const deserialized = input;

    this.setState({presetName, name, input, sszType: type, error, deserialized});
  }

  render() {
    const {presetName, input, sszType, error, serialized, hashTreeRoot, deserialized} = this.state;
    const {serializeModeOn} = this.props;
    const treeKey = hashTreeRoot ? toHexString(hashTreeRoot) : "";
    const bounceLoader = <BounceLoader css="margin: auto;" />;

    return (
      <div className='section serialize-section is-family-code'>
        <LoadingOverlay
          active={this.state.showOverlay}
          spinner={bounceLoader}
          text={this.state.overlayText}
        >
        </LoadingOverlay>
        <div className='container'>
          <div className='columns is-desktop'>
            <div className='column'>
              <Input
                serializeModeOn={serializeModeOn}
                onProcess={this.process.bind(this)}
                sszType={sszType}
                serialized={serialized}
                deserialized={deserialized}
                setOverlay={this.setOverlay.bind(this)}
              />
            </div>
            <div className='column'>
              <Output
                deserialized={deserialized}
                serializeModeOn={serializeModeOn}
                serialized={serialized}
                hashTreeRoot={hashTreeRoot}
                error={error}
                sszType={sszType}
              />
            </div>
          </div>
        </div>
        {
          // (!error && input && sszType && presetName) && <TreeView key={treeKey} presetName={presetName} input={input} sszType={sszType} sszTypeName={this.state.name}/>
        }
      </div>
    );
  }
}
