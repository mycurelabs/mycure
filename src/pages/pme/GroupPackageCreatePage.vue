<template lang="pug">
q-header(bordered).text-black.bg-white
  q-toolbar
    q-btn(
      icon="la la-arrow-left"
      dense
      flat
      round
      @click="goBack"
    )
    q-toolbar-title Create Group Report

q-drawer(
  v-model="leftDrawer"
  side="left"
  show-if-above
  bordered
  :width="400"
)
  div.row
    div.col-xs-12.q-pa-md
      span.text-subtitle1 Package Details
    div.col-xs-12.q-pa-md
      q-form(ref="mainFormRef")
        q-input(
          v-model="contractLabel"
          label="Label"
          outlined
          :rules="[v => !!v || 'This is required']"
        ).q-mb-md
        div.q-gutter-sm.q-mb-sm
          q-radio(
            v-model="accountType"
            val="company"
            label="Company"
          )
          q-radio(
            v-model="accountType"
            val="hmo"
            label="HMO"
          )
        template(v-if="accountType === 'company'")
          q-select(
            v-model="selectedCompany"
            label="Companies"
            dropdown-icon="la la-angle-down"
            outlined
            :options="companies"
            :rules="[v => !!v || 'This is required']"
          ).q-mb-md
        template(v-if="accountType === 'hmo'")
          q-select(
            v-model="selectedHMO"
            label="HMOs"
            dropdown-icon="la la-angle-down"
            outlined
            :options="hmos"
            :rules="[v => !!v || 'This is required']"
          ).q-mb-md
        date-filter(
          label="Select Date"
          color="primary"
          dropdown-icon="la la-angle-down"
          style="width: 100%"
          outlined
          :rules="[v => !!v || 'This is required']"
          @selected="onDateSelect"
        ).q-mb-md
        search-services(
          label="Search Services"
          input-debounce="500"
          style="min-width: 300px"
          clear-icon="las la-times"
          dropdown-icon="la la-angle-down"
          outlined
          use-input
          clearable
          :rules="[v => !!v || 'This is required']"
          @select="onServiceSelect"
        ).q-mb-md
generic-page(
  skeleton="table"
  padding
  :loading="loading"
)
  q-table(
    ref="tableRef"
    color="primary"
    :columns="patientColumns"
    :dense="$q.screen.lt.md"
    :rows="patientRows"
    :loading="loading"
    :visible-columns="visiblePatientColumns"
  ).shadow-1
    //- Title
    template(v-slot:top-left)
      q-toolbar-title
        q-icon(
          size="25px"
          name="las la-users"
          style="margin-bottom: 5px;"
        ).text-primary.q-mr-sm
        span Patients
    //- Search and filter
    template(v-slot:top-right)
      search-patients(@select="onPatientSelect").q-mr-sm
    //- Table body
    template(v-slot:body="props")
      q-tr(:props="props" class="hover:bg-grey-3 cursor-pointer")
        q-td(key="id" :props="props")
          span {{props.row.id || '-'}}
        q-td(key="name" :props="props")
          span {{props.row.name || '-'}}
        q-td(key="date-of-birth" :props="props")
          span {{props.row.dateOfBirth}}
        q-td(key="sex" :props="props")
          span {{props.row.sex || '-'}}
        q-td(key="status" :props="props")
          q-badge(color="primary").q-mr-sm Existing
        q-td(key="action" :props="props")
          q-btn(
            icon="la la-trash"
            color="negative"
            round
            flat
            @click="onRemovePatient(props.row.index)"
          )
    //- No data
    template(v-slot:no-data)
      div(style="height: 200px").row.full-width.justify-center.items-center
        div.col-xs-12.text-center
          q-icon(name="la la-meh" size="60px").text-grey
          h2.text-grey.text-h6 No Patients

q-footer(
  bordered
).bg-white
  q-toolbar
    q-space
    q-btn(
      label="Save Group Report"
      color="primary"
      unelevated
      no-caps
      @click="onSubmit"
    )
</template>

<script>
import { getInsuranceFacilities, createInsuranceContracts } from '@/services/insurance-contracts';
import { onMounted, ref, computed } from 'vue';
import { useHelpers } from '@/composables/helpers';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/current-user';
import { format } from 'date-fns';
import DateFilter from '@/components/commons/filters/DateFilter';
import SearchServices from '@/components/commons/search/SearchServices';
import SearchPatients from '@/components/commons/search/SearchPatients';
import GenericPage from '@/components/commons/GenericPage';
import { useQuasarMixins } from '@/composables/quasar-mixins';

export default {
  components: {
    DateFilter,
    GenericPage,
    SearchServices,
    SearchPatients,
  },
  setup () {
    const { showSnack } = useQuasarMixins();
    const { tableColumnBuilder } = useHelpers();
    const userStore = useUserStore();
    const activeOrganization = computed(() => userStore.$state.userActiveOrganization);
    // const route = useRoute();
    const router = useRouter();
    const leftDrawer = ref(false);
    const loading = ref(false);
    const tableRef = ref(null);
    const selectedPatients = ref([]);
    const selectedService = ref({});
    const contractLabel = ref('');
    const accountType = ref('company');
    const companies = ref([]);
    const hmos = ref([]);
    const selectedCompany = ref(null);
    const selectedHMO = ref(null);
    const selectedDate = ref(null);
    const mainFormRef = ref(null);

    const patientRows = computed(() => {
      const patients = selectedPatients.value || [];
      return patients.map((patient, index) => {
        const name = patient?.name || {};
        const dateOfBirth = patient?.dateOfBirth ? format(patient?.dateOfBirth, 'MMM dd, yyyy') : '-';
        const sex = patient?.sex || '';
        return {
          index,
          id: patient?.id,
          name: `${name.lastName}, ${name.firstName}`,
          dateOfBirth,
          sex: `${sex.charAt(0).toUpperCase()}${sex.substring(1, sex.length)}`,
          $data: patient,
        };
      });
    });
    const patientColumns = tableColumnBuilder([
      {
        name: 'id',
        field: 'id',
        label: 'Id',
      },
      {
        name: 'name',
        field: 'name',
        label: 'Name',
      },
      {
        name: 'date-of-birth',
        field: 'dateOfBirth',
        label: 'Birthday',
      },
      {
        name: 'sex',
        field: 'sex',
        label: 'Sex',
      },
      {
        name: 'status',
        field: 'status',
        label: 'Status',
      },
      {
        name: 'action',
        label: 'Action',
      },
    ]);
    const visiblePatientColumns = ref(patientColumns.map(column => column.name));

    async function init () {
      try {
        loading.value = true;
        await getCompanies();
        await getHMOs();
      } catch (e) {
        console.error(e);
      } finally {
        loading.value = false;
      }
    }

    async function onSubmit () {
      try {
        loading.value = true;
        if (!await mainFormRef.value.validate()) return;
        if (!selectedDate.value?.dates?.start || !selectedDate.value?.dates?.end) {
          showSnack({
            message: 'Invalid date range',
            color: 'warning',
          });
          return;
        }
        if (!selectedPatients.value.length) {
          showSnack({
            message: 'No patients selected. Select at least one patient.',
            color: 'warning',
          });
          return;
        }
        const payload = selectedPatients.value.map(patient => {
          const insurer = accountType.value === 'company' ? selectedCompany.value?.value : selectedHMO.value?.value;
          const type = accountType.value === 'company' ? 'corporate-partner-patient' : 'insurance-patient';
          return {
            label: contractLabel.value,
            expiresAt: selectedDate.value.dates.end,
            insured: patient.id,
            insurer,
            meta: {
              service: selectedService.value.id,
            },
            startAt: selectedDate.value.dates.start,
            type,
          };
        });
        console.warn('payload', payload);
        await createInsuranceContracts(payload);
        showSnack({
          message: 'Success!',
          color: 'positive',
        });
        router.go(-1);
      } catch (e) {
        console.error(e);
      } finally {
        loading.value = false;
      }
    }

    async function getCompanies () {
      const opts = {
        facility: activeOrganization.value.id,
        type: 'corporate-partner-facility',
      };
      const { items } = await getInsuranceFacilities(opts);
      companies.value = items.map(item => ({ value: item.insurer, label: item.insurerName }));
    }

    async function getHMOs () {
      const opts = {
        facility: activeOrganization.value.id,
        type: 'insurance-facility',
        insurerSubtype: 'hmo',
      };
      const { items } = await getInsuranceFacilities(opts);
      hmos.value = items.map(item => item.insurerData).map(item => ({ value: item.id, label: item.name }));
    }

    function onServiceSelect (service) {
      selectedService.value = service;
    }

    function onPatientSelect (patient) {
      selectedPatients.value.push(patient);
    }

    function onRemovePatient (index) {
      selectedPatients.value.splice(index, 1);
    }

    function onDateSelect (date) {
      selectedDate.value = date;
    }

    function goBack () {
      router.push({ name: 'pme-group-packages' });
    }

    onMounted(() => init());

    return {
      accountType,
      companies,
      contractLabel,
      hmos,
      leftDrawer,
      loading,
      mainFormRef,
      patientColumns,
      patientRows,
      selectedCompany,
      selectedDate,
      selectedHMO,
      selectedPatients,
      tableRef,
      visiblePatientColumns,
      //
      goBack,
      onDateSelect,
      onPatientSelect,
      onRemovePatient,
      onServiceSelect,
      onSubmit,
    };
  },
};
</script>
