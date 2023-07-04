import React from 'react';
import { useState, useEffect } from "react";
import { SSRProvider } from 'react-bootstrap';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import FormCheck from 'react-bootstrap/FormCheck';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import { ConanListFilter, ConanSearchBar, ConanMultiSelectFilter } from "../components/searchbar";
import ListGroup from 'react-bootstrap/ListGroup';
import Link from 'next/link';
import { ConanCenterHeader } from '../components/header';
import ConanFooter from '../components/footer';
import { LiaBalanceScaleSolid, LiaGithub } from "react-icons/lia";
import {get_json_list, get_urls, get_json_list_with_id} from '../service/service';


export async function getServerSideProps(context) {
  let { defaultValue, defaultTopics, defaultLicenses } = context.query;

  let value = defaultValue || 'all';
  defaultTopics = defaultTopics || [];
  if (typeof defaultTopics === "string"){
    defaultTopics = [defaultTopics]
  }
  defaultLicenses = defaultLicenses || [];
  if (typeof defaultLicenses === "string"){
    defaultLicenses = [defaultLicenses]
  }
  defaultValue = defaultValue || '';
  let urls = get_urls({search: value, topics: defaultTopics})
  const topics_list = await get_json_list_with_id(urls.topics, urls.api.private);
  const licenses_list = await get_json_list_with_id(urls.licenses, urls.api.private);

  return {
    props: {
      data: {
        licenses: licenses_list.map(elem => {return {filter: elem.value.filter, id: elem.value.id};}),
        topics: topics_list.map(elem => {return {filter: elem.value.filter, id: elem.value.id};}),
        defaultValue: defaultValue,
        defaultTopics: defaultTopics,
        defaultLicenses: defaultLicenses,
        packages: await get_json_list(urls.search.package, urls.api.private),
      },
    },
  }
}

function PackageInfo(props) {
  return (
    <div className="m-2">
      <Row>
        <Col xs lg><Link href={"/center/" + props.data.name}><a><h3>{props.data.name}</h3></a></Link></Col>
        <Col xs lg><b>last version:</b> {props.data.info.version}</Col>
      </Row>
      <Row><Col xs lg><LiaBalanceScaleSolid className="conanIconBlue"/> {props.data.info.licenses.join(", ")}</Col></Row>
      {props.data.info.downloads > 0  &&
        <Row><Col xs lg="3"><b>Downloads:</b> {props.data.info.downloads}</Col></Row>
      }
      <Row><Col xs lg className="mt-2">{props.data.info.description}</Col></Row>
      <Row><Col xs lg className="mt-2"><p> {props.data.info.labels.map((item) => (<Badge key={item}>#{item}</Badge>))}</p></Col></Row>
    </div>
  )
}

function SearchList(props) {

  return (
    <ListGroup>
    {props.data && props.data.map(
      (info) => (
        <ListGroup.Item style={{borderRadius: '10px'}} className="mt-4" key={info.name}>
          <PackageInfo data={info}/>
        </ListGroup.Item>)
      )
    }
    </ListGroup>
  )
}

export default function ConanSearch(props) {
  const [value, setValue] = useState(props.data.defaultValue);
  const [topics, setTopics] = useState(props.data.defaultTopics);
  const [licenses, setLicenses] = useState(props.data.defaultLicenses);
  const [allTopics, setAllTopics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(props.data.packages);


  const getData = async (value, topiclist, licenseList) => {
    console.log(value, licenseList, topiclist)
    setLoading(true);
    try {
      value = value || 'all';
      let urls = get_urls({search: value, topics: topiclist, licenses: licenseList})
      const packages = await get_json_list(urls.search.package, urls.api.public);
      setData(packages);
    } catch(err) {
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e) => {
    setValue(e);
  }

  var handleTopics = (selectedOption) => {
    let newTopics = selectedOption.map(elem => {return elem.value})
    setTopics(newTopics);
    getData(value, newTopics, licenses);
  }

  var handleLicenses = (selectedOption) => {
    let newLicenses = selectedOption.map(elem => {return elem.value})
    setLicenses(newLicenses);
    getData(value, topics, newLicenses);
  }

  const handleSubmit = (event) => {
    getData(value, topics, licenses);
    event.preventDefault();
  }
  return (
    <React.StrictMode>
      <SSRProvider>
      <div className="flex-wrapper bg-conan-blue">
        <ConanCenterHeader/>
          <br/>
          <Container className="conancontainer">
            <Form onSubmit={e => handleSubmit(e)}>
              <Row>
                <Col><ConanSearchBar value={value} handleChange={handleChange} searchButton={false}/></Col>
              </Row>
            </Form>
            <Row className="justify-content-md-center mt-2">
              <Col xs lg="3"><ConanMultiSelectFilter title="Licenses" filters={props.data.licenses} handleFilter={handleLicenses}/></Col>
              <Col xs lg="3"><ConanMultiSelectFilter title="Topics" filters={props.data.topics} handleFilter={handleTopics}/></Col>
            </Row>
            <br/>
            <div style={{width: "100%"}}>
              <h2 className="text-center">
              packages ({!loading && data.length}{loading && <div className="spinner-grow"></div>})
              </h2>
              <SearchList loading={loading} data={data}/>
            </div>
          </Container>
          <br/>
        <ConanFooter/>
      </div>
      </SSRProvider>
    </React.StrictMode>

  );
}
