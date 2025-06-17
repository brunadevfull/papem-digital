import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useDisplay } from "@/context/DisplayContext";
import { CalendarDays, FileText, AlertCircle, TrendingUp } from "lucide-react";

const Analytics: React.FC = () => {
  const { notices, plasaDocuments, escalaDocuments } = useDisplay();

  // Calculate analytics data
  const totalNotices = notices.length;
  const activeNotices = notices.filter(n => n.active).length;
  const totalDocuments = plasaDocuments.length + escalaDocuments.length;
  const activeDocuments = [...plasaDocuments, ...escalaDocuments].filter(d => d.active).length;

  const priorityData = [
    { name: "Alta", value: notices.filter(n => n.priority === "high").length, color: "#ef4444" },
    { name: "Média", value: notices.filter(n => n.priority === "medium").length, color: "#f97316" },
    { name: "Baixa", value: notices.filter(n => n.priority === "low").length, color: "#22c55e" }
  ];

  const documentTypeData = [
    { name: "PLASA", documents: plasaDocuments.length, active: plasaDocuments.filter(d => d.active).length },
    { name: "Escala", documents: escalaDocuments.length, active: escalaDocuments.filter(d => d.active).length }
  ];

  const systemMetrics = [
    {
      title: "Taxa de Ativação",
      value: totalNotices > 0 ? Math.round((activeNotices / totalNotices) * 100) : 0,
      icon: TrendingUp,
      color: "text-green-500"
    },
    {
      title: "Documentos Ativos",
      value: totalDocuments > 0 ? Math.round((activeDocuments / totalDocuments) * 100) : 0,
      icon: FileText,
      color: "text-blue-500"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Avisos</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalNotices}</div>
            <p className="text-xs text-muted-foreground">
              {activeNotices} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documentos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDocuments}</div>
            <p className="text-xs text-muted-foreground">
              {activeDocuments} ativos
            </p>
          </CardContent>
        </Card>

        {systemMetrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}%</div>
              <Progress value={metric.value} className="mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Prioridades</CardTitle>
            <CardDescription>Avisos por nível de prioridade</CardDescription>
          </CardHeader>
          <CardContent>
            {totalNotices > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                Nenhum aviso cadastrado
              </div>
            )}
            <div className="flex justify-center gap-4 mt-4">
              {priorityData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status dos Documentos</CardTitle>
            <CardDescription>Comparação de documentos por tipo</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={documentTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="documents" fill="#3b82f6" name="Total" />
                <Bar dataKey="active" fill="#10b981" name="Ativos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Avisos Recentes</CardTitle>
          <CardDescription>Últimos avisos cadastrados no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {notices.length > 0 ? (
            <div className="space-y-3">
              {notices.slice(0, 5).map((notice) => (
                <div key={notice.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{notice.title}</h4>
                    <p className="text-sm text-muted-foreground truncate">
                      {notice.content}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      notice.priority === "high" ? "destructive" :
                      notice.priority === "medium" ? "default" : "secondary"
                    }>
                      {notice.priority}
                    </Badge>
                    <Badge variant={notice.active ? "default" : "secondary"}>
                      {notice.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum aviso cadastrado no sistema
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;