import React, { useMemo, useCallback } from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, Tab, Alert, Box, Typography } from "@mui/material";
import { ImportHelper, DateHelper, CurrencyHelper } from ".";
import { ImportGroupInterface, ImportPersonInterface, ImportDonationBatchInterface, ImportFundInterface, ImportDataInterface } from "../helpers/ImportHelper";

interface Props { importData: ImportDataInterface, triggerRender: number }

export const ImportPreview: React.FC<Props> = React.memo((props) => {
  const [activeTab, setActiveTab] = React.useState('people');

  const handleTabChange = useCallback((_event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  }, []);

  const peopleTableRows = useMemo(() => {
    if (props.importData.households.length === 0) return null;

    const rows = [];
    for (let i = 0; i < props.importData.households.length; i++) {
      const household = props.importData.households[i];
      rows.push(
        <TableRow key={`household-${household.importKey}`}>
          <TableCell colSpan={3}>
            <i>{household.name} Household</i>
          </TableCell>
        </TableRow>
      );

      const members = ImportHelper.getHouseholdMembers(household.importKey, props.importData.people);
      for (let j = 0; j < members.length; j++) {
        const person = members[j];
        const imgTag = (person.photo && person.photo !== "")
          ? <img src={person.photo} className="personPhoto" alt="person" />
          : null;

        rows.push(
          <TableRow key={`person-${person.importKey || person.name.first + person.name.last + j}`}>
            <TableCell>{imgTag}</TableCell>
            <TableCell>{person.name.first}</TableCell>
            <TableCell>{person.name.last}</TableCell>
          </TableRow>
        );
      }
    }
    return rows;
  }, [props.importData.households, props.importData.people]);

  const getPeopleTable = useMemo(() => {
    if (props.importData.households.length === 0) return (
      <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
        <Typography variant="body1">No people will be imported</Typography>
      </Box>
    );

    return (
      <TableContainer sx={{ bgcolor: 'background.paper' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Photo</TableCell>
              <TableCell>First Name</TableCell>
              <TableCell>Last Name</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>{peopleTableRows}</TableBody>
        </Table>
      </TableContainer>
    );
  }, [peopleTableRows, props.importData.households.length]);

  const getMemberCount = useCallback((groupKey: string) => {
    const count = ImportHelper.getGroupMembers(props.importData.groupMembers, groupKey).length;
    return count === 1 ? "1 member" : `${count} members`;
  }, [props.importData.groupMembers]);

  const getGroupsTable = useMemo(() => {
    if (props.importData.groups.length === 0) return (
      <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
        <Typography variant="body1">No groups will be imported</Typography>
      </Box>
    );

    const rows = [];

    // Process campus-service-time-group relationships
    for (const campus of props.importData.campuses) {
      const filteredServices = ImportHelper.getServices(props.importData.services, campus.importKey);

      for (const service of filteredServices) {
        const filteredTimes = ImportHelper.getServiceTimes(props.importData.serviceTimes, service.importKey);

        for (const time of filteredTimes) {
          const filteredGroupServiceTimes = ImportHelper.getGroupServiceTimes(props.importData.groupServiceTimes, time.importKey);

          for (const gst of filteredGroupServiceTimes) {
            const group = props.importData.groups.find(g => g.id === gst.groupId);
            if (group) {
              rows.push(
                <TableRow key={`${campus.importKey}-${service.importKey}-${time.importKey}-${group.importKey}`}>
                  <TableCell>{campus.name}</TableCell>
                  <TableCell>{service.name}</TableCell>
                  <TableCell>{time.name}</TableCell>
                  <TableCell>{group.categoryName}</TableCell>
                  <TableCell>{group.name}</TableCell>
                  <TableCell>{getMemberCount(group.importKey)}</TableCell>
                </TableRow>
              );
            }
          }
        }
      }
    }

    // Process groups without service times
    for (const group of props.importData.groups) {
      const groupServiceTimes = ImportHelper.getGroupServiceTimesByGroupKey(props.importData.groupServiceTimes, group.importKey);
      if (groupServiceTimes.length === 0) {
        rows.push(
          <TableRow key={`standalone-${group.importKey}`}>
            <TableCell></TableCell>
            <TableCell></TableCell>
            <TableCell></TableCell>
            <TableCell>{group.categoryName}</TableCell>
            <TableCell>{group.name}</TableCell>
            <TableCell>{getMemberCount(group.importKey)}</TableCell>
          </TableRow>
        );
      }
    }

    return (
      <TableContainer sx={{ bgcolor: 'background.paper' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Campus</TableCell>
              <TableCell>Service</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Group</TableCell>
              <TableCell>Members</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>{rows}</TableBody>
        </Table>
      </TableContainer>
    );
  }, [props.importData.groups, props.importData.campuses, props.importData.services, props.importData.serviceTimes, props.importData.groupServiceTimes, getMemberCount]);

  const getAttendanceTable = useMemo(() => {
    if (props.importData.sessions.length === 0) return (
      <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
        <Typography variant="body1">No attendance records will be imported</Typography>
      </Box>
    );

    const rows = props.importData.sessions.map((session, index) => {
      const group: ImportGroupInterface = ImportHelper.getByImportKey(props.importData.groups, session.groupKey);
      const vs = ImportHelper.getVisitSessions(props.importData.visitSessions, session.importKey);

      return (
        <TableRow key={`session-${session.importKey || index}`}>
          <TableCell>{DateHelper.prettyDate(new Date(session.sessionDate))}</TableCell>
          <TableCell>{group?.name}</TableCell>
          <TableCell>{vs.length}</TableCell>
        </TableRow>
      );
    });

    return (
      <TableContainer sx={{ bgcolor: 'background.paper' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Group</TableCell>
              <TableCell>Visits</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>{rows}</TableBody>
        </Table>
      </TableContainer>
    );
  }, [props.importData.sessions, props.importData.groups, props.importData.visitSessions]);

  const getDonationsTable = useMemo(() => {
    if (props.importData.donations.length === 0) return (
      <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
        <Typography variant="body1">No donations will be imported</Typography>
      </Box>
    );

    const rows = props.importData.donations.map((donation, index) => {
      const batch: ImportDonationBatchInterface = ImportHelper.getByImportKey(props.importData.batches, donation.batchKey);
      const fund: ImportFundInterface = ImportHelper.getByImportKey(props.importData.funds, donation.fundKey);
      const person: ImportPersonInterface = ImportHelper.getByImportKey(props.importData.people, donation.personId);
      const personName = person ? `${person.name.first} ${person.name.last}` : "";

      return (
        <TableRow key={`donation-${donation.importKey || index}`}>
          <TableCell>{DateHelper.prettyDate(new Date(donation.donationDate))}</TableCell>
          <TableCell>{batch?.name}</TableCell>
          <TableCell>{personName}</TableCell>
          <TableCell>{fund?.name}</TableCell>
          <TableCell>{CurrencyHelper.formatCurrency(donation.amount)}</TableCell>
        </TableRow>
      );
    });

    return (
      <TableContainer sx={{ bgcolor: 'background.paper' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Batch</TableCell>
              <TableCell>Person</TableCell>
              <TableCell>Fund</TableCell>
              <TableCell>Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>{rows}</TableBody>
        </Table>
      </TableContainer>
    );
  }, [props.importData.donations, props.importData.batches, props.importData.funds, props.importData.people]);

  const getFormsTable = useMemo(() => {
    if (props.importData.forms.length === 0) return (
      <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
        <Typography variant="body1">No forms will be imported</Typography>
      </Box>
    );

    const rows = props.importData.forms.map((form, index) => (
      <TableRow key={`form-${form.importKey || form.name || index}`}>
        <TableCell>{form.name}</TableCell>
        <TableCell>{form.contentType}</TableCell>
      </TableRow>
    ));

    return (
      <TableContainer sx={{ bgcolor: 'background.paper' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Content Type</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>{rows}</TableBody>
        </Table>
      </TableContainer>
    );
  }, [props.importData.forms]);

  if (props.importData.people.length === 0) return (
    <Alert severity="info">
      <strong>Important:</strong> This tool is designed to help you load your initial data into the system. Using it after you have been using B1 for a while is risky and may result in duplicated data.
    </Alert>
  );
  else return (
    <Box>
      {/* Tab Navigation */}
      <Box sx={{
        borderBottom: 1,
        borderColor: 'divider',
        mb: 2
      }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="People" value="people" />
          <Tab label="Groups" value="groups" />
          <Tab label="Attendance" value="attendance" />
          <Tab label="Donations" value="donations" />
          <Tab label="Forms" value="forms" />
        </Tabs>
      </Box>

      {/* Tab Content - Tables Only */}
      {activeTab === 'people' && getPeopleTable}
      {activeTab === 'groups' && getGroupsTable}
      {activeTab === 'attendance' && getAttendanceTable}
      {activeTab === 'donations' && getDonationsTable}
      {activeTab === 'forms' && getFormsTable}
    </Box>
  );
}, (prevProps, nextProps) =>
  // Only re-render if the import data or triggerRender actually changes
  (
    prevProps.importData === nextProps.importData
    && prevProps.triggerRender === nextProps.triggerRender
  )
);
